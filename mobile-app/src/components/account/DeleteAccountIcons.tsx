import React from 'react';
import { SvgXml } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

const RECEIPT_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const BOOKMARK_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#64748B" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PIN_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C16 16.5 19 13 19 9.5C19 5.634 15.866 2.5 12 2.5C8.134 2.5 5 5.634 5 9.5C5 13 8 16.5 12 21Z" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" stroke="#64748B" stroke-width="1.8"/></svg>`;

const PERCENT_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="5" x2="5" y2="19" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="2.5" stroke="#64748B" stroke-width="1.8"/><circle cx="17" cy="17" r="2.5" stroke="#64748B" stroke-width="1.8"/></svg>`;

const INFO_XML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="#64748B" stroke-width="1.8"/><circle cx="12" cy="7.5" r="0.75" fill="#64748B"/><line x1="12" y1="11" x2="12" y2="16.5" stroke="#64748B" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const SUCCESS_CHECK_XML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4.5 4.5L19 7" stroke="#1E7A46" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function DeleteAccountReceiptIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={RECEIPT_XML} width={size} height={size} />;
}

export function DeleteAccountBookmarkIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={BOOKMARK_XML} width={size} height={size} />;
}

export function DeleteAccountPinIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={PIN_XML} width={size} height={size} />;
}

export function DeleteAccountPercentIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={PERCENT_XML} width={size} height={size} />;
}

export function DeleteAccountInfoIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={INFO_XML} width={size} height={size} />;
}

export function DeleteAccountSuccessCheckIcon({ size = 36 }: IconProps) {
  return <SvgXml xml={SUCCESS_CHECK_XML} width={size} height={size} />;
}

export function DeleteAccountCheckboxBox({
  checked,
  size = 22,
}: {
  checked: boolean;
  size?: number;
}) {
  return (
    <SvgXml
      xml={
        checked
          ? `<svg width="${size}" height="${size}" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="22" height="22" rx="6" fill="#D9383A"/><path d="M6 11.5L9.5 15L16 8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg width="${size}" height="${size}" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="20" height="20" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/></svg>`
      }
      width={size}
      height={size}
    />
  );
}

