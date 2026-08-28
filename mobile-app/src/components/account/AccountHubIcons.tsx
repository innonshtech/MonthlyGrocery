import React from 'react';
import { SvgXml } from 'react-native-svg';
import { AddressPinIcon } from '../CheckoutFigmaIcons';
import { HubChevronIcon } from '../monthlyGrocery/MonthlyGroceryHubIcons';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

const PERCENT_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.8333 4.16667L4.16667 15.8333" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.25 8.33333C7.40059 8.33333 8.33333 7.40059 8.33333 6.25C8.33333 5.09941 7.40059 4.16667 6.25 4.16667C5.09941 4.16667 4.16667 5.09941 4.16667 6.25C4.16667 7.40059 5.09941 8.33333 6.25 8.33333Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.75 15.8333C14.9006 15.8333 15.8333 14.9006 15.8333 13.75C15.8333 12.5994 14.9006 11.6667 13.75 11.6667C12.5994 11.6667 11.6667 12.5994 11.6667 13.75C11.6667 14.9006 12.5994 15.8333 13.75 15.8333Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const HELP_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.75 7.5C7.75 6.5335 8.5335 5.75 9.5 5.75C10.4665 5.75 11.25 6.5335 11.25 7.5C11.25 8.4665 10.4665 9.25 9.5 9.25V10.75" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 13.25H9.50833" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round"/><path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="#1E7A46" stroke-width="1.5"/></svg>`;

const ABOUT_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6667 2.5H5.83333C5.21449 2.5 4.621 2.74583 4.18342 3.18342C3.74583 3.621 3.5 4.21449 3.5 4.83333V15.1667C3.5 15.7855 3.74583 16.379 4.18342 17.0566C4.621 17.379 5.21449 17.5 5.83333 17.5H14.1667C14.7855 17.5 15.379 17.2542 15.8566 16.8166C16.379 16.379 16.5 15.7855 16.5 15.1667V7.5L11.6667 2.5Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6667 2.5V7.5H16.5" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LOGOUT_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.75 15.75H3.75C3.28587 15.75 2.82361 15.6573 2.3618 15.4508C1.89999 15.2443 1.49129 14.8601 1.10516 14.3949C0.719028 13.9297 0.420382 13.4325 0.220191 12.9375C0.0200001 12.4425 -0.0790959 12.0475 0.0409524 11.5625L1.125 7.125" stroke="#6B7772" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.75 8.25H16.5L14.25 5.25" stroke="#6B7772" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.25 11.25L16.5 8.25" stroke="#6B7772" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const GUEST_XML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 15C17.0711 15 18.75 13.3211 18.75 11.25C18.75 9.17893 17.0711 7.5 15 7.5C12.9289 7.5 11.25 9.17893 11.25 11.25C11.25 13.3211 12.9289 15 15 15Z" stroke="#1E7A46" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5625 24.375C7.17826 22.6786 8.25119 21.1901 9.62999 20.1299C11.0088 19.0697 12.637 18.4375 14.25 18.4375C15.863 18.4375 17.5112 19.0697 18.87 20.1299C20.2488 21.1901 21.3217 22.6786 21.9375 24.375" stroke="#1E7A46" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SAVINGS_COIN_LARGE_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 1.16667V26.8333M19.3333 5.83333H11.8333C10.7145 5.83333 9.67083 6.26217 8.55842 6.87975C7.55417 7.44342 6.33333 8.33333 6.33333 10.3333C6.33333 12.3333 7.55417 13.2233 8.55842 13.8798C9.67083 14.5042 10.7145 14.8333 11.8333 14.8333H16.1667C17.2855 14.8333 18.3292 15.2622 19.3836 15.8798C20.4219 16.4434 21.3333 17.3333 21.3333 19.3333C21.3333 21.3333 20.4219 22.2233 19.3836 22.8798C18.3292 23.5042 17.2855 23.8333 16.1667 23.8333H6.33333" stroke="#17251E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DELETE_TRASH_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4H14" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66667 7.33333V11.3333" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.33333 7.33333V11.3333" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.33333 4L4 13.3333C4 13.6869 4.14048 14.0261 4.39052 14.2761C4.64057 14.5262 4.99978 14.6667 5.33333 14.6667H10.6667C11.0002 14.6667 11.3594 14.5262 11.6095 14.2761C11.8595 14.0261 12 13.6869 12 13.3333L12.6667 4" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66667 4V2.66667C6.66667 2.31305 6.80615 1.97391 6.95619 1.77386C7.19424 1.52381 7.44744 1.33333 7.66667 1.33333H8.33333C8.88662 1.33333 9.33333 1.78005 9.33333 2.33333V4" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PHONE_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16667 2.5H6.66667L8.33333 6.66667L6.25 8.75C7.18449 10.5592 9.44076 12.6955 11.25 13.75L13.3333 11.6667L17.5 13.3333V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5C8.48833 17.5 2.5 11.5117 2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function HelpSupportPhoneIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PHONE_XML} width={size} height={size} />;
}

export function AccountDeleteTrashIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={DELETE_TRASH_XML} width={size} height={size} />;
}

export function AccountMenuPinIcon({ size = 20 }: IconProps) {
  return <AddressPinIcon size={size} />;
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

export function AccountLogoutIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={LOGOUT_XML} width={size} height={size} />;
}

export function AccountGuestIcon({ size = 30 }: IconProps) {
  return <SvgXml xml={GUEST_XML} width={size} height={size} />;
}

export function AccountSavingsCoinLargeIcon({ size = 28 }: IconProps) {
  return <SvgXml xml={SAVINGS_COIN_LARGE_XML} width={size} height={size} />;
}

export function AccountChevronIcon({ size = 20, color = COLORS.ink300 }: IconProps) {
  return <HubChevronIcon size={size} color={color} />;
}
