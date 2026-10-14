#import <React/RCTBridgeModule.h>
#import <React/RCTReloadCommand.h>

@interface OtaUpdateModule : NSObject <RCTBridgeModule>
@end

@implementation OtaUpdateModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSURL *)getOtaDirectory {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSURL *appSupport = [[fileManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject];
  NSURL *otaDir = [appSupport URLByAppendingPathComponent:@"ota_bundle" isDirectory:YES];
  if (![fileManager fileExistsAtPath:otaDir.path]) {
    [fileManager createDirectoryAtURL:otaDir withIntermediateDirectories:YES attributes:nil error:nil];
  }
  return otaDir;
}

- (NSURL *)getActiveBundleURL {
  return [[self getOtaDirectory] URLByAppendingPathComponent:@"main.jsbundle"];
}

- (NSURL *)getMetaFileURL {
  return [[self getOtaDirectory] URLByAppendingPathComponent:@"ota_meta.json"];
}

RCT_EXPORT_METHOD(getCurrentBundleInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSURL *metaFile = [self getMetaFileURL];
    NSURL *activeBundle = [self getActiveBundleURL];

    NSString *version = @"base-app";
    if ([fileManager fileExistsAtPath:metaFile.path]) {
      NSData *data = [NSData dataWithContentsOfURL:metaFile];
      if (data) {
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        if (json && json[@"version"]) {
          version = json[@"version"];
        }
      }
    }

    BOOL isOtaActive = [fileManager fileExistsAtPath:activeBundle.path];
    double bundleSizeBytes = 0.0;
    if (isOtaActive) {
      NSDictionary *attrs = [fileManager attributesOfItemAtPath:activeBundle.path error:nil];
      if (attrs) {
        bundleSizeBytes = [attrs[NSFileSize] doubleValue];
      }
    }

    resolve(@{
      @"version": version,
      @"isOtaActive": @(isOtaActive),
      @"bundleSizeBytes": @(bundleSizeBytes)
    });
  } @catch (NSException *exception) {
    reject(@"INFO_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(downloadAndInstallBundle:(NSString *)bundleUrlString
                  version:(NSString *)version
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try {
      NSURL *bundleURL = [NSURL URLWithString:bundleUrlString];
      if (!bundleURL) {
        reject(@"INVALID_URL", @"Invalid bundle URL", nil);
        return;
      }

      NSFileManager *fileManager = [NSFileManager defaultManager];
      NSURL *otaDir = [self getOtaDirectory];
      NSURL *stagingFile = [otaDir URLByAppendingPathComponent:@"staging.bundle"];
      if ([fileManager fileExistsAtPath:stagingFile.path]) {
        [fileManager removeItemAtURL:stagingFile error:nil];
      }

      NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:bundleURL];
      request.timeoutInterval = 60.0;

      dispatch_semaphore_t sem = dispatch_semaphore_create(0);
      __block NSData *downloadedData = nil;
      __block NSError *downloadError = nil;
      __block NSHTTPURLResponse *httpResponse = nil;

      NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        downloadedData = data;
        downloadError = error;
        httpResponse = (NSHTTPURLResponse *)response;
        dispatch_semaphore_signal(sem);
      }];
      [task resume];
      dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

      if (downloadError) {
        reject(@"DOWNLOAD_ERROR", downloadError.localizedDescription, downloadError);
        return;
      }
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        reject(@"HTTP_ERROR", [NSString stringWithFormat:@"Server returned HTTP %ld", (long)httpResponse.statusCode], nil);
        return;
      }
      if (!downloadedData || downloadedData.length < 1024) {
        reject(@"INVALID_BUNDLE", @"Downloaded bundle is invalid or too small", nil);
        return;
      }

      [downloadedData writeToURL:stagingFile atomically:YES];

      NSURL *activeBundle = [self getActiveBundleURL];
      if ([fileManager fileExistsAtPath:activeBundle.path]) {
        [fileManager removeItemAtURL:activeBundle error:nil];
      }

      NSError *moveError = nil;
      [fileManager moveItemAtURL:stagingFile toURL:activeBundle error:&moveError];
      if (moveError) {
        reject(@"MOVE_ERROR", moveError.localizedDescription, moveError);
        return;
      }

      NSDictionary *meta = @{
        @"version": version,
        @"installedAt": @([[NSDate date] timeIntervalSince1970] * 1000)
      };
      NSData *metaData = [NSJSONSerialization dataWithJSONObject:meta options:0 error:nil];
      [metaData writeToURL:[self getMetaFileURL] atomically:YES];

      resolve(@{
        @"success": @YES,
        @"version": version
      });
    } @catch (NSException *exception) {
      reject(@"DOWNLOAD_EXCEPTION", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(rollbackBundle:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSURL *activeBundle = [self getActiveBundleURL];
    NSURL *metaFile = [self getMetaFileURL];
    if ([fileManager fileExistsAtPath:activeBundle.path]) {
      [fileManager removeItemAtURL:activeBundle error:nil];
    }
    if ([fileManager fileExistsAtPath:metaFile.path]) {
      [fileManager removeItemAtURL:metaFile error:nil];
    }
    resolve(@YES);
  } @catch (NSException *exception) {
    reject(@"ROLLBACK_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(restartApp) {
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTTriggerReloadCommandListeners(@"OTA Update Reload");
  });
}

@end
