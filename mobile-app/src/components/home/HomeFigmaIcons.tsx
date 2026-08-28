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

export function HomeSearchIcon({
  size = 18,
  color = COLORS.ink300,
}: IconProps) {
  return <OnboardingSearchIcon size={size} color={color} />;
}

export function HomeMicIcon({
  size = 18,
  color = COLORS.ink300,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(MIC_XML, color)} width={size} height={size} />
  );
}

export function HomeChevronDownIcon({
  size = 16,
  color = COLORS.green900,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(CHEVRON_DOWN_XML, color)} width={size} height={size} />
  );
}

export function HomeDeliveryIcon({ size = 12 }: IconProps) {
  return <HomeSparkleIcon size={size} />;
}

export function HomeSparkleIcon({ size = 24 }: IconProps) {
  return <SvgXml xml={SPARKLE_XML} width={size} height={size} />;
}

export function HomeArrowRightIcon({
  size = 18,
  color = COLORS.green900,
}: IconProps) {
  return <OnboardingChevronRightIcon size={size} color={color} />;
}
