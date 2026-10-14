import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "MonthlyGroceryMobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    let fileManager = FileManager.default
    if let appSupport = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first {
      let otaBundle = appSupport.appendingPathComponent("ota_bundle/main.jsbundle")
      if fileManager.fileExists(atPath: otaBundle.path) {
        if let attrs = try? fileManager.attributesOfItem(atPath: otaBundle.path),
           let size = attrs[.size] as? UInt64, size > 1024 {
          return otaBundle
        }
      }
    }
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
