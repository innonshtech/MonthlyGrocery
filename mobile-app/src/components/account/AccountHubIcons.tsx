import React from 'react';
import { SvgXml } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

const PIN_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C16 16.5 19 13 19 9.5C19 5.634 15.866 2.5 12 2.5C8.134 2.5 5 5.634 5 9.5C5 13 8 16.5 12 21Z" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" stroke="#1E7A46" stroke-width="1.8"/></svg>`;

const PERCENT_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="5" x2="5" y2="19" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="2.5" stroke="#1E7A46" stroke-width="1.8"/><circle cx="17" cy="17" r="2.5" stroke="#1E7A46" stroke-width="1.8"/></svg>`;

const HELP_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="#1E7A46" stroke-width="1.8"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="0.75" fill="#1E7A46"/></svg>`;

const ABOUT_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="#1E7A46" stroke-width="1.8"/><circle cx="12" cy="7.5" r="0.75" fill="#1E7A46"/><line x1="12" y1="11" x2="12" y2="16.5" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const LOGOUT_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const GUEST_XML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 15C17.0711 15 18.75 13.3211 18.75 11.25C18.75 9.17893 17.0711 7.5 15 7.5C12.9289 7.5 11.25 9.17893 11.25 11.25C11.25 13.3211 12.9289 15 15 15Z" stroke="#1E7A46" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5625 24.375C7.17826 22.6786 8.25119 21.1901 9.62999 20.1299C11.0088 19.0697 12.637 18.4375 14.25 18.4375C15.863 18.4375 17.5112 19.0697 18.87 20.1299C20.2488 21.1901 21.3217 22.6786 21.9375 24.375" stroke="#1E7A46" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SAVINGS_COIN_LARGE_XML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6.5" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CHEVRON_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PHONE_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16667 2.5H6.66667L8.33333 6.66667L6.25 8.75C7.18449 10.5592 9.44076 12.6955 11.25 13.75L13.3333 11.6667L17.5 13.3333V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5C8.48833 17.5 2.5 11.5117 2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function HelpSupportPhoneIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PHONE_XML} width={size} height={size} />;
}

export function AccountDeleteTrashIcon({ size = 18, color = '#E53E3E' }: IconProps) {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="11" x2="10" y2="17" stroke="${color}" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="11" x2="14" y2="17" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function AccountMenuPinIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PIN_XML} width={size} height={size} />;
}

export function AccountMenuPercentIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PERCENT_XML} width={size} height={size} />;
}

export function AccountMenuHelpIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={HELP_XML} width={size} height={size} />;
}

export function AccountMenuAboutIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={ABOUT_XML} width={size} height={size} />;
}

export function AccountLogoutIcon({ size = 20, color = '#E53E3E' }: IconProps) {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function AccountCameraIcon({ size = 14, color = '#FFFFFF' }: IconProps) {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="${color}" stroke-width="2"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function AccountGuestIcon({ size = 30 }: IconProps) {
  return <SvgXml xml={GUEST_XML} width={size} height={size} />;
}

export function AccountSavingsCoinLargeIcon({ size = 26 }: IconProps) {
  return <SvgXml xml={SAVINGS_COIN_LARGE_XML} width={size} height={size} />;
}

export function AccountChevronIcon({ size = 18, color = '#94A3B8' }: IconProps) {
  const xml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
