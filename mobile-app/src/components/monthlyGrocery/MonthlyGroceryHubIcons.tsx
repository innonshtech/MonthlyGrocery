import React from 'react';
import { SvgXml } from 'react-native-svg';
import { OnboardingChevronRightIcon } from '../onboarding/OnboardingFigmaIcons';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

const HERO_BADGE_XML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.25L8.625 5.4375L12.8125 6.5625L8.625 7.6875L7.5 11.875L6.375 7.6875L2.1875 6.5625L6.375 5.4375L7.5 1.25Z" fill="#F5A524"/></svg>`;

const ONE_CLICK_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L12.2 7.8L18 10L12.2 12.2L10 18L7.8 12.2L2 10L7.8 7.8L10 2Z" fill="#1E7A46"/>
  <path d="M18 13L19.2 16.3L22.5 17.5L19.2 18.7L18 22L16.8 18.7L13.5 17.5L16.8 16.3L18 13Z" fill="#1E7A46"/>
</svg>`;

const COPY_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C14.28 5 16.31 6.09 17.6 7.78" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 3V8H13" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SAVED_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 3H18C18.5523 3 19 3.44772 19 4V21L12 17.5L5 21V4C5 3.44772 5.44772 3 6 3Z" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const BUILD_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="9" y1="6" x2="20" y2="6" stroke="#6B7772" stroke-width="2" stroke-linecap="round"/>
  <line x1="9" y1="12" x2="20" y2="12" stroke="#6B7772" stroke-width="2" stroke-linecap="round"/>
  <line x1="9" y1="18" x2="20" y2="18" stroke="#6B7772" stroke-width="2" stroke-linecap="round"/>
  <circle cx="4" cy="6" r="1.5" fill="#6B7772"/>
  <circle cx="4" cy="12" r="1.5" fill="#6B7772"/>
  <circle cx="4" cy="18" r="1.5" fill="#6B7772"/>
</svg>`;

export function HubHeroBadgeIcon({ size = 15 }: IconProps) {
  return <SvgXml xml={HERO_BADGE_XML} width={size} height={size} />;
}

export function HubOneClickIcon({ size = 22 }: IconProps) {
  return <SvgXml xml={ONE_CLICK_XML} width={size} height={size} />;
}

export function HubCopyIcon({ size = 21 }: IconProps) {
  return <SvgXml xml={COPY_XML} width={size} height={size} />;
}

export function HubSavedIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={SAVED_XML} width={size} height={size} />;
}

export function HubBuildIcon({ size = 21 }: IconProps) {
  return <SvgXml xml={BUILD_XML} width={size} height={size} />;
}

export function HubChevronIcon({ size = 20, color = COLORS.ink300 }: IconProps) {
  return <OnboardingChevronRightIcon size={size} color={color} />;
}

