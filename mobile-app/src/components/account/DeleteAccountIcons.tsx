import React from 'react';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

const DELETE_X_XML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3.5L10.5 10.5" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/><path d="M10.5 3.5L3.5 10.5" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const WARNING_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.33333V8.66667" stroke="#92400E" stroke-width="1.5" stroke-linecap="round"/><path d="M8 11.3333H8.00667" stroke="#92400E" stroke-width="1.5" stroke-linecap="round"/><path d="M7.28667 2.5L1.62 12.1667C1.44776 12.4699 1.38651 12.7706 1.46399 13.0167C1.56147 13.2628 1.77376 13.4444 2.05333 13.5H13.9467C14.2262 13.4444 14.4385 13.2628 14.536 13.0167C14.6135 12.7706 14.5522 12.4699 14.38 12.1667L8.71333 2.5C8.54109 2.19678 8.27043 2 8 2C7.72957 2 7.50091 2.19678 7.32867 2.5H7.28667Z" stroke="#92400E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SUCCESS_CHECK_XML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 16.5L13.5 22L24 11" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function DeleteAccountItemXIcon({ size = 14 }: IconProps) {
  return <SvgXml xml={DELETE_X_XML} width={size} height={size} />;
}

export function DeleteAccountWarningIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={WARNING_XML} width={size} height={size} />;
}

export function DeleteAccountSuccessCheckIcon({ size = 32 }: IconProps) {
  return <SvgXml xml={SUCCESS_CHECK_XML} width={size} height={size} />;
}

export function DeleteAccountCheckboxBox({
  checked,
  size = 20,
}: {
  checked: boolean;
  size?: number;
}) {
  return (
    <SvgXml
      xml={
        checked
          ? `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="18" height="18" rx="4" fill="#DC2626" stroke="#DC2626" stroke-width="1.5"/><path d="M5.5 10L8.5 13L14.5 7" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="18" height="18" rx="4" fill="#FFFFFF" stroke="${COLORS.ink300}" stroke-width="1.5"/></svg>`
      }
      width={size}
      height={size}
    />
  );
}
