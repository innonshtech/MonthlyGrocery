import React from 'react';
import { SvgXml } from 'react-native-svg';
import { OnboardingChevronRightIcon } from '../onboarding/OnboardingFigmaIcons';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

const HERO_BADGE_XML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.25L8.625 5.4375L12.8125 6.5625L8.625 7.6875L7.5 11.875L6.375 7.6875L2.1875 6.5625L6.375 5.4375L7.5 1.25Z" fill="#F5A524"/></svg>`;

const ONE_CLICK_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2.75L12.375 7.5625L17.25 8.875L12.375 10.1875L11 15L9.625 10.1875L4.75 8.875L9.625 7.5625L11 2.75Z" fill="white"/><path d="M17.875 4.125L18.5625 6.0625L20.5 6.75L18.5625 7.4375L17.875 9.5L17.1875 7.4375L15.25 6.75L17.1875 6.0625L17.875 4.125Z" fill="white"/></svg>`;

const COPY_XML = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.188 10.5C17.188 14.227 14.227 17.188 10.5 17.188C6.773 17.188 3.813 14.227 3.813 10.5C3.813 6.773 6.773 3.813 10.5 3.813C12.652 3.813 14.684 4.698 15.938 6.188" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.938 2.188V5.938H12.188" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SAVED_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2.5H15V17.5L10 14.1667L5 17.5V2.5Z" stroke="#1E7A46" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const BUILD_XML = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 4.5H14.5V16.5H6.5V4.5Z" stroke="#1E7A46" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 7.5H12.5M8.5 10.5H12.5M8.5 13.5H11" stroke="#1E7A46" stroke-width="1.4" stroke-linecap="round"/></svg>`;

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
