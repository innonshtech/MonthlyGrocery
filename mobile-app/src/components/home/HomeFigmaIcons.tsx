import React from 'react';
import { SvgXml } from 'react-native-svg';
import { OnboardingSearchIcon, OnboardingChevronRightIcon } from '../onboarding/OnboardingFigmaIcons';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

function tintStroke(xml: string, color: string) {
  return xml.replace(/stroke="[^"]+"/g, `stroke="${color}"`);
}

const CHEVRON_DOWN_XML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5L10 12.5L15 7.5" stroke="#0F3D28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const MIC_XML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10V5C12.5 3.61929 11.3807 2.5 10 2.5C8.61929 2.5 7.5 3.61929 7.5 5V10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#A7B0AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.25 10C16.25 13.4518 13.4518 16.25 10 16.25C6.54822 16.25 3.75 13.4518 3.75 10M10 16.25V18.75" stroke="#A7B0AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SPARKLE_XML = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5L9.2 5.8L13.5 7L9.2 8.2L8 12.5L6.8 8.2L2.5 7L6.8 5.8L8 1.5Z" fill="white"/><path d="M13 2L13.6 3.8L15.4 4.4L13.6 5L13 6.8L12.4 5L10.6 4.4L12.4 3.8L13 2Z" fill="white"/></svg>`;

const LIGHTNING_XML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.125 1.25L1.875 8.75H6.25L5.625 13.75L11.875 6.25H7.5L8.125 1.25Z" fill="#F5A524"/></svg>`;

export function HomeSearchIcon({
  size = 20,
  color = '#1E7A46',
}: IconProps) {
  return <OnboardingSearchIcon size={size} color={color} />;
}

export function HomeMicIcon({
  size = 20,
  color = '#1E7A46',
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(MIC_XML, color)} width={size} height={size} />
  );
}

export function HomeChevronDownIcon({
  size = 16,
  color = '#FFFFFF',
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(CHEVRON_DOWN_XML, color)} width={size} height={size} />
  );
}

export function HomeDeliveryIcon({ size = 15, color = '#FFFFFF' }: IconProps) {
  const xml = LIGHTNING_XML.replace(/fill="[^"]+"/g, `fill="${color}"`);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function HomeSparkleIcon({ size = 26 }: IconProps) {
  return <SvgXml xml={SPARKLE_XML} width={size} height={size} />;
}

export function HomeArrowRightIcon({
  size = 20,
  color = '#FFFFFF',
}: IconProps) {
  return <OnboardingChevronRightIcon size={size} color={color} />;
}

const PROMO_ILLUSTRATION_XML = `<svg width="90" height="80" viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="24" width="60" height="46" rx="12" fill="white" fill-opacity="0.22" />
  <rect x="22" y="16" width="46" height="54" rx="10" fill="#17251E" fill-opacity="0.15" />
  <circle cx="45" cy="42" r="18" fill="#FBE0AE" />
  <path d="M45 30V54M33 42H57" stroke="#E07C0E" stroke-width="3" stroke-linecap="round" />
  <path d="M38 36L52 48M52 36L38 48" stroke="#17251E" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="68" cy="22" r="8" fill="#FFF3D6" />
  <path d="M68 18L69.5 21L72.5 22L69.5 23L68 26L66.5 23L63.5 22L66.5 21L68 18Z" fill="#E07C0E" />
  <circle cx="20" cy="60" r="6" fill="#FBE0AE" />
</svg>`;

export function HomePromoIllustration({ width = 90, height = 80 }: { width?: number; height?: number }) {
  return <SvgXml xml={PROMO_ILLUSTRATION_XML} width={width} height={height} />;
}

