import React from 'react';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

type IconProps = { size?: number; color?: string };

function tintStroke(xml: string, color: string) {
  return xml.replace(/stroke="[^"]+"/g, `stroke="${color}"`);
}

/** H1 · Offline — Lucide wifi-off geometry, Figma green700 @ 54px */
const OFFLINE_WIFI_XML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h.01" stroke="#1E7A46" stroke-width="2" stroke-linecap="round"/><path d="M8.5 16.429a5 5 0 0 1 7 0" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m2 2 20 20" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** H2 · Unserviceable — filled marigold map pin (same as A6 / onboarding unserviceable) */
const UNSERVICEABLE_PIN_XML = `<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 31.1667C17 31.1667 26.9167 22.2417 26.9167 15.5833C26.9167 14.2811 26.6602 12.9915 26.1618 11.7884C25.6634 10.5852 24.933 9.49204 24.0121 8.57119C23.0913 7.65034 21.9981 6.91989 20.7949 6.42153C19.5918 5.92317 18.3023 5.66667 17 5.66667C15.6977 5.66667 14.4082 5.92317 13.2051 6.42153C12.0019 6.91989 10.9087 7.65034 9.98786 8.57119C9.06701 9.49204 8.33655 10.5852 7.83819 11.7884C7.33984 12.9915 7.08333 14.2811 7.08333 15.5833C7.08333 22.2417 17 31.1667 17 31.1667Z" fill="#C77E12"/><path d="M17 17.7083C18.956 17.7083 20.5417 16.1227 20.5417 14.1667C20.5417 12.2107 18.956 10.625 17 10.625C15.044 10.625 13.4583 12.2107 13.4583 14.1667C13.4583 16.1227 15.044 17.7083 17 17.7083Z" fill="white"/></svg>`;

/** H3 · Generic error — triangle alert, brand error @ 52px */
const ERROR_WARNING_XML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" stroke="#D8453B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v4" stroke="#D8453B" stroke-width="2" stroke-linecap="round"/><path d="M12 17h.01" stroke="#D8453B" stroke-width="2" stroke-linecap="round"/></svg>`;

/** H4 · Maintenance — wrench, Figma green700 @ 52px */
const MAINTENANCE_WRENCH_XML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const SYSTEM_STATE_ICON_SIZES = {
  offline: 54,
  unserviceable: 54,
  error: 52,
  maintenance: 52,
} as const;

export function SystemStateOfflineIcon({
  size = SYSTEM_STATE_ICON_SIZES.offline,
  color = COLORS.green700,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(OFFLINE_WIFI_XML, color)} width={size} height={size} />
  );
}

export function SystemStateUnserviceableIcon({
  size = SYSTEM_STATE_ICON_SIZES.unserviceable,
  color = COLORS.marigold600,
}: IconProps) {
  const xml = UNSERVICEABLE_PIN_XML.replace('fill="#C77E12"', `fill="${color}"`);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function SystemStateErrorIcon({
  size = SYSTEM_STATE_ICON_SIZES.error,
  color = COLORS.error,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(ERROR_WARNING_XML, color)} width={size} height={size} />
  );
}

export function SystemStateMaintenanceIcon({
  size = SYSTEM_STATE_ICON_SIZES.maintenance,
  color = COLORS.green700,
}: IconProps) {
  return (
    <SvgXml xml={tintStroke(MAINTENANCE_WRENCH_XML, color)} width={size} height={size} />
  );
}
