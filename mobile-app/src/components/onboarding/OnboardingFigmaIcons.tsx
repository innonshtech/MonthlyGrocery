import React from 'react';
import { SvgXml } from 'react-native-svg';
import {
  CheckoutBackIcon,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
} from '../CheckoutFigmaIcons';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

function tintStroke(xml: string, color: string) {
  return xml.replace(/stroke="[^"]+"/g, `stroke="${color}"`);
}

/** Figma A5/A6 — search field icon */
const SEARCH_XML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="#A7B0AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 17.5L13.875 13.875" stroke="#A7B0AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Figma location-detect card chevron */
const CHEVRON_RIGHT_XML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Figma city row — building / landmark outline */
const CITY_BUILDING_XML = `<svg viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.16667 17.4167V4.75C3.16667 3.97631 3.85198 3.16667 4.75 3.16667H8.70833V6.33333H10.2917V3.16667H14.25C15.148 3.16667 15.8333 3.97631 15.8333 4.75V17.4167" stroke="#3D4A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.58333 17.4167H17.4167" stroke="#3D4A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.33333 7.91667H6.34167M6.33333 11.0833H6.34167M6.33333 14.25H6.34167M9.5 7.91667H9.50833M9.5 11.0833H9.50833M9.5 14.25H9.50833M12.6667 7.91667H12.675M12.6667 11.0833H12.675M12.6667 14.25H12.675" stroke="#3D4A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Figma area row + serving line — stroke map pin (matches checkout addr-pin) */
const AREA_PIN_XML = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14C8 14 12.6667 9.8 12.6667 6.66667C12.6667 6.05383 12.546 5.447 12.3114 4.88081C12.0769 4.31462 11.7332 3.80017 11.2998 3.36683C10.8665 2.93349 10.352 2.58975 9.78586 2.35523C9.21967 2.12071 8.61284 2 8 2C7.38716 2 6.78033 2.12071 6.21414 2.35523C5.64796 2.58975 5.13351 2.93349 4.70017 3.36683C4.26683 3.80017 3.92308 4.31462 3.68856 4.88081C3.45404 5.447 3.33333 6.05383 3.33333 6.66667C3.33333 9.8 8 14 8 14Z" stroke="#1E7A46" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8.33333C8.92047 8.33333 9.66667 7.58714 9.66667 6.66667C9.66667 5.74619 8.92047 5 8 5C7.07953 5 6.33333 5.74619 6.33333 6.66667C6.33333 7.58714 7.07953 8.33333 8 8.33333Z" stroke="#1E7A46" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Figma unserviceable hero — filled map pin */
const AREA_PIN_LARGE_XML = `<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 31.1667C17 31.1667 26.9167 22.2417 26.9167 15.5833C26.9167 14.2811 26.6602 12.9915 26.1618 11.7884C25.6634 10.5852 24.933 9.49204 24.0121 8.57119C23.0913 7.65034 21.9981 6.91989 20.7949 6.42153C19.5918 5.92317 18.3023 5.66667 17 5.66667C15.6977 5.66667 14.4082 5.92317 13.2051 6.42153C12.0019 6.91989 10.9087 7.65034 9.98786 8.57119C9.06701 9.49204 8.33655 10.5852 7.83819 11.7884C7.33984 12.9915 7.08333 14.2811 7.08333 15.5833C7.08333 22.2417 17 31.1667 17 31.1667Z" fill="#C77E12"/><path d="M17 17.7083C18.956 17.7083 20.5417 16.1227 20.5417 14.1667C20.5417 12.2107 18.956 10.625 17 10.625C15.044 10.625 13.4583 12.2107 13.4583 14.1667C13.4583 16.1227 15.044 17.7083 17 17.7083Z" fill="white"/></svg>`;

export function OnboardingBackIcon({ size = 22 }: IconProps) {
  return <CheckoutBackIcon size={size} />;
}

export function OnboardingSearchIcon({
  size = 18,
  color = COLORS.ink300,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(SEARCH_XML, color)} width={size} height={size} />
  );
}

export function OnboardingChevronRightIcon({
  size = 20,
  color = COLORS.green700,
}: IconProps) {
  return (
    <SvgXml
      xml={tintStroke(CHEVRON_RIGHT_XML, color)}
      width={size}
      height={size}
    />
  );
}

export function OnboardingCityIcon({
  size = 19,
  color = COLORS.ink700,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(CITY_BUILDING_XML, color)} width={size} height={size} />
  );
}

export function OnboardingAreaPinIcon({
  size = 18,
  color = COLORS.green700,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(AREA_PIN_XML, color)} width={size} height={size} />
  );
}

export function OnboardingAreaPinLargeIcon({
  size = 48,
  color = COLORS.marigold600,
}: IconProps) {
  const xml = AREA_PIN_LARGE_XML.replace(
    'fill="#C77E12"',
    `fill="${color}"`,
  );
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function OnboardingRadioIcon({
  selected,
  size = 22,
}: {
  selected: boolean;
  size?: number;
}) {
  return selected ? (
    <AddressRadioOnIcon size={size} />
  ) : (
    <AddressRadioOffIcon size={size} />
  );
}
