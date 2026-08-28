import React from 'react';
import { SvgXml } from 'react-native-svg';

/** Exact Figma MCP-exported SVGs for Checkout E1 redesign */

const BACK_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="#17251E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const HOME_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 8.75L10 2.5L17.5 8.75" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.16667 7.91667V17.5H15.8333V7.91667" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CLOCK_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 5.83333V10L12.5 11.6667" stroke="#1E7A46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PLUS_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="#1E7A46" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PERCENT_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.8333 4.16667L4.16667 15.8333" stroke="#C77E12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.25 8.33333C7.40059 8.33333 8.33333 7.40059 8.33333 6.25C8.33333 5.09941 7.40059 4.16667 6.25 4.16667C5.09941 4.16667 4.16667 5.09941 4.16667 6.25C4.16667 7.40059 5.09941 8.33333 6.25 8.33333Z" stroke="#C77E12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.75 15.8333C14.9006 15.8333 15.8333 14.9006 15.8333 13.75C15.8333 12.5994 14.9006 11.6667 13.75 11.6667C12.5994 11.6667 11.6667 12.5994 11.6667 13.75C11.6667 14.9006 12.5994 15.8333 13.75 15.8333Z" stroke="#C77E12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const ATTA_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6351 0.482218C15.1947 0.482218 13.3412 1.92033 11.7973 4.23577C9.99134 6.94477 10.9659 8.89388 11.7491 10.4596C11.8697 10.7007 12.1061 10.8617 12.3752 10.8866C12.3978 10.8873 12.4211 10.8889 12.4445 10.8889C12.6879 10.8889 12.9189 10.7746 13.0667 10.5778C14.9287 8.09433 17.8975 4.20311 18.4388 3.661C18.585 3.51555 18.6667 3.31722 18.6667 3.11111C18.6667 1.17289 17.6167 0.482218 16.6351 0.482218ZM18.4847 7.47833C17.5436 7.47833 16.4819 8.35877 14.9341 10.4222C13.2821 12.6241 13.02 14.5546 14.0825 16.681C14.1999 16.9159 14.4278 17.0753 14.6883 17.1057C14.7179 17.1096 14.7482 17.1111 14.7778 17.1111C15.0072 17.1111 15.2266 17.0092 15.3759 16.8319C16.7129 15.2273 19.3993 12.0346 19.9943 11.4388C20.1406 11.2926 20.2222 11.095 20.2222 10.8889C20.2222 10.045 20.2222 7.47833 18.4847 7.47833Z" fill="#FFCC4D"/><path d="M23.2354 8.95767C23.027 8.58278 22.5525 8.449 22.1784 8.65823C16.601 11.7561 11.4583 19.6638 9.44853 23.9097C10.1003 15.9802 13.78 8.31989 19.9944 2.10545C20.2985 1.80134 20.2985 1.30978 19.9944 1.00567C19.6903 0.70156 19.1988 0.70156 18.8946 1.00567C12.7012 7.19912 8.91809 14.7856 8.00186 22.6909C7.47764 18.2599 7.2412 11.872 9.26575 7.31578C9.44075 6.923 9.26342 6.46334 8.87142 6.28912C8.47864 6.11334 8.01898 6.29145 7.84475 6.68345C6.81342 9.00356 6.33198 11.7398 6.1632 14.4682C5.47564 13.0029 4.66753 11.6667 3.47831 11.6667H3.44253C2.73475 11.6667 2.12731 12.0291 1.63731 13.0091C1.4452 13.3933 1.60075 13.7262 1.98498 13.9183C2.36998 14.1112 2.83664 13.9541 3.02875 13.5707C3.27064 13.0869 3.43709 12.9718 3.43398 12.9547C3.92864 13.1071 4.79042 15.0516 5.11553 15.7873C5.26798 16.1319 5.40642 16.4422 5.52542 16.6818C5.64053 16.912 5.85598 17.0536 6.09164 17.0932C6.11186 20.9487 6.63453 24.5054 6.9962 26.4973L7.01175 26.5829C7.0802 26.9586 7.40764 27.2222 7.77709 27.2222C7.82298 27.2222 7.86964 27.2183 7.91631 27.2098C8.0112 27.1919 8.09598 27.1546 8.17375 27.1071C8.28809 27.174 8.41331 27.2222 8.55564 27.2222C8.69798 27.2222 8.8232 27.174 8.93831 27.1079C9.05031 27.174 9.1732 27.2222 9.3132 27.2222H9.33342C9.74564 27.2222 10.0886 26.8738 10.1112 26.46C10.1555 25.6534 12.051 21.7824 14.8891 17.871C14.97 17.8593 15.0501 17.8453 15.1263 17.8072C15.3161 17.7123 15.5284 17.5957 15.7548 17.4704C16.4812 17.0683 17.6945 16.3971 18.1705 16.6771C18.2864 16.7456 18.6668 17.0932 18.6668 18.6667C18.6668 19.0968 19.0144 19.4444 19.4445 19.4444C19.8746 19.4444 20.2223 19.0968 20.2223 18.6667C20.2223 16.9276 19.8101 15.8387 18.9608 15.3378C18.3518 14.9792 17.6634 15.008 16.9852 15.2024C18.7896 13.0916 20.8259 11.1852 22.9329 10.0147C23.3093 9.80545 23.4446 9.33334 23.2354 8.95767Z" fill="#77B255"/></svg>`;

const RICE_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 28C2.366 28 0.777778 16.3333 0.777778 13.2222H27.2222C27.2222 14.7778 25.6993 28 14 28Z" fill="#DD2E44"/><path d="M14 20.6111C21.3024 20.6111 27.2222 17.3225 27.2222 13.2658C27.2222 9.20906 21.3024 5.92044 14 5.92044C6.69757 5.92044 0.777778 9.20906 0.777778 13.2658C0.777778 17.3225 6.69757 20.6111 14 20.6111Z" fill="#A0041E"/><path d="M14 19.4444C9.33333 19.4444 1.55556 17.1111 1.55556 13.2222C1.55556 8.55556 6.31944 3.11111 14 3.11111C21.6806 3.11111 26.4444 9.33333 26.4444 13.2222C26.4444 17.1111 19.4444 19.4444 14 19.4444Z" fill="#E6E9EA"/></svg>`;

const OIL_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.7937 2.21275C28.7382 3.09631 25.6846 6.41742 23.9751 7.38731C22.2655 8.35798 15.8434 11.592 15.4273 11.3143C15.0112 11.0366 17.8299 6.0472 20.6485 4.1992C23.4672 2.3512 25.7772 1.75075 26.7937 2.21275ZM14.7343 14.4565C15.7796 14.0645 20.0014 15.519 22.0345 16.9058C24.0676 18.2918 25.1767 20.51 24.2986 21.2489C23.4205 21.9878 19.7704 21.434 17.4604 19.3542C15.1504 17.2744 13.9946 14.7342 14.7343 14.4565ZM7.47996 2.30531C9.21052 2.00664 9.69741 5.58598 9.14363 8.35798C8.58985 11.13 6.18652 16.6289 5.77041 16.7206C5.3543 16.8132 3.5063 12.1924 3.82985 8.81998C4.15341 5.44676 6.13985 2.53631 7.47996 2.30531Z" fill="#3E721D"/><path d="M1.01119 25.5702C0.948969 25.5702 0.885969 25.5578 0.825302 25.5329C0.577191 25.4294 0.459747 25.1455 0.563191 24.8974C2.42441 20.4205 5.27808 18.1735 7.34541 17.0769C8.56652 16.429 9.63052 15.3277 10.4845 14.4425C11.0002 13.9082 11.4459 13.447 11.8589 13.1421C12.9143 12.362 16.7861 9.64599 16.951 9.53088C17.1703 9.3761 17.4736 9.43054 17.6276 9.64988C17.7816 9.86999 17.7287 10.1725 17.5086 10.3273C17.469 10.3553 13.4821 13.1514 12.4367 13.9245C12.0891 14.182 11.6699 14.616 11.1845 15.1192C10.2823 16.0533 9.15919 17.2161 7.80119 17.9363C5.87541 18.9583 3.2123 21.0614 1.46152 25.2723C1.38219 25.4574 1.20175 25.5702 1.01119 25.5702Z" fill="#C1694F"/><path d="M25.1541 15.1604C24.5319 17.2659 22.4638 17.2402 20.4205 16.5698C18.3773 15.8993 16.632 14.0148 17.0131 12.2982C17.3942 10.5817 20.0604 10.3258 22.1565 10.9573C24.2527 11.5897 25.6947 13.3303 25.1541 15.1604ZM10.2985 18.6612C11.2894 17.4036 13.7635 17.9682 15.2888 19.0773C16.814 20.1864 17.6913 22.4506 16.7673 23.6981C15.8433 24.9457 13.5333 25.2226 11.7771 24.0217C10.0209 22.82 9.09688 20.1864 10.2985 18.6612ZM13.7635 2.48967C15.9429 2.75567 16.2587 4.79967 15.9351 6.92534C15.6115 9.051 14.0404 11.0841 12.285 10.9916C10.5295 10.899 9.83577 8.31134 10.1134 6.13978C10.3911 3.96822 11.8697 2.25867 13.7635 2.48967Z" fill="#909B50"/></svg>`;

const DAL_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.7505 6.41432C9.94752 5.94869 8.99249 5.82108 8.09546 6.05956C7.19842 6.29804 6.43285 6.88308 5.96714 7.68598C5.18781 9.02998 5.55725 9.13187 4.33692 11.2358C3.11036 13.3505 2.85136 13.0573 2.06503 14.4138C1.5994 15.2167 1.4718 16.1717 1.71028 17.0688C1.94876 17.9658 2.53379 18.7314 3.3367 19.1971C8.44903 22.1635 16.107 9.52154 10.7505 6.41432ZM22.9818 20.188C22.8751 19.7409 22.6813 19.3193 22.4116 18.9471C22.1419 18.5749 21.8016 18.2595 21.41 18.0188C21.0184 17.7782 20.5832 17.617 20.1293 17.5445C19.6755 17.4721 19.2118 17.4897 18.7647 17.5964C17.2535 17.9573 17.4347 18.2956 15.0679 18.8603C12.6903 19.4281 12.7245 19.0384 11.1993 19.4024C10.7522 19.5092 10.3305 19.7029 9.95834 19.9726C9.58615 20.2423 9.27073 20.5827 9.03008 20.9742C8.78943 21.3658 8.62827 21.801 8.5558 22.2549C8.48332 22.7088 8.50096 23.1725 8.6077 23.6195C9.98047 29.3696 24.4199 26.2111 22.9818 20.188ZM22.9056 15.1526C23.3173 14.9482 23.6846 14.6647 23.9868 14.3183C24.2889 13.9719 24.5198 13.5694 24.6663 13.1337C24.8129 12.6981 24.8722 12.2378 24.8408 11.7792C24.8095 11.3207 24.6881 10.8728 24.4837 10.4611C23.7923 9.06965 23.5037 9.32165 22.4218 7.14309C21.3345 4.95365 21.7218 4.8992 21.0249 3.49532C20.612 2.6639 19.8859 2.03051 19.0061 1.73442C18.1263 1.43834 17.1649 1.5038 16.3334 1.91643C11.0383 4.54609 17.3593 17.9068 22.9056 15.1526Z" fill="#CA694D"/></svg>`;

const FALLBACK_EMOJIS = [ATTA_XML, RICE_XML, OIL_XML, DAL_XML];

type IconProps = { size?: number };

export function CheckoutBackIcon({ size = 24 }: IconProps) {
  return <SvgXml xml={BACK_XML} width={size} height={size} />;
}

export function CheckoutHomeIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={HOME_XML} width={size} height={size} />;
}

export function CheckoutClockIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={CLOCK_XML} width={size} height={size} />;
}

export function CheckoutPlusIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PLUS_XML} width={size} height={size} />;
}

export function CheckoutPercentIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PERCENT_XML} width={size} height={size} />;
}

export function CheckoutFallbackEmoji({ index, size = 28 }: { index: number; size?: number }) {
  const xml = FALLBACK_EMOJIS[index % FALLBACK_EMOJIS.length];
  return <SvgXml xml={xml} width={size} height={size} />;
}

export const THUMB_BG = ['#FFF3D6', '#FDE4E7', '#E4F3EA', '#F6E9E1'] as const;

/** E2 Select Address icons (Figma MCP exports) */
const RADIO_ON_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93739 16.0626 1.83333 11 1.83333C5.93739 1.83333 1.83333 5.93739 1.83333 11C1.83333 16.0626 5.93739 20.1667 11 20.1667Z" fill="#1E7A46"/><path d="M11 14.6667C13.025 14.6667 14.6667 13.025 14.6667 11C14.6667 8.97496 13.025 7.33333 11 7.33333C8.97496 7.33333 7.33333 8.97496 7.33333 11C7.33333 13.025 8.97496 14.6667 11 14.6667Z" fill="white"/></svg>`;

const RADIO_OFF_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="10.2" stroke="#A7B0AB" stroke-width="1.6"/></svg>`;

const PIN_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14C8 14 12.6667 9.8 12.6667 6.66667C12.6667 6.05383 12.546 5.447 12.3114 4.88081C12.0769 4.31462 11.7332 3.80017 11.2998 3.36683C10.8665 2.93349 10.352 2.58975 9.78586 2.35523C9.21967 2.12071 8.61284 2 8 2C7.38716 2 6.78033 2.12071 6.21414 2.35523C5.64796 2.58975 5.13351 2.93349 4.70017 3.36683C4.26683 3.80017 3.92308 4.31462 3.68856 4.88081C3.45404 5.447 3.33333 6.05383 3.33333 6.66667C3.33333 9.8 8 14 8 14Z" stroke="#1E7A46" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8.33333C8.92047 8.33333 9.66667 7.58714 9.66667 6.66667C9.66667 5.74619 8.92047 5 8 5C7.07953 5 6.33333 5.74619 6.33333 6.66667C6.33333 7.58714 7.07953 8.33333 8 8.33333Z" stroke="#1E7A46" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EDIT_XML = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 14.1667H14.875" stroke="#6B7772" stroke-width="1.275" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6875 2.47917C11.9693 2.19737 12.3515 2.03907 12.75 2.03907C13.1485 2.03907 13.5307 2.19737 13.8125 2.47917C14.0943 2.76096 14.2526 3.14315 14.2526 3.54167C14.2526 3.94018 14.0943 4.32237 13.8125 4.60417L4.95833 13.4583L2.125 14.1667L2.83333 11.3333L11.6875 2.47917Z" stroke="#6B7772" stroke-width="1.275" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function AddressRadioOnIcon({ size = 22 }: IconProps) {
  return <SvgXml xml={RADIO_ON_XML} width={size} height={size} />;
}

export function AddressRadioOffIcon({ size = 22 }: IconProps) {
  return <SvgXml xml={RADIO_OFF_XML} width={size} height={size} />;
}

export function AddressPinIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={PIN_XML} width={size} height={size} />;
}

export function AddressEditIcon({ size = 17 }: IconProps) {
  return <SvgXml xml={EDIT_XML} width={size} height={size} />;
}

const MAP_PIN_LARGE_XML = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 31.1667C17 31.1667 26.9167 22.2417 26.9167 15.5833C26.9167 14.2811 26.6602 12.9915 26.1618 11.7884C25.6634 10.5852 24.933 9.49204 24.0121 8.57119C23.0913 7.65034 21.9981 6.91989 20.7949 6.42153C19.5918 5.92317 18.3023 5.66667 17 5.66667C15.6977 5.66667 14.4082 5.92317 13.2051 6.42153C12.0019 6.91989 10.9087 7.65034 9.98786 8.57119C9.06701 9.49204 8.33655 10.5852 7.83819 11.7884C7.33984 12.9915 7.08333 14.2811 7.08333 15.5833C7.08333 22.2417 17 31.1667 17 31.1667Z" fill="#1E7A46"/><path d="M17 17.7083C18.956 17.7083 20.5417 16.1227 20.5417 14.1667C20.5417 12.2107 18.956 10.625 17 10.625C15.044 10.625 13.4583 12.2107 13.4583 14.1667C13.4583 16.1227 15.044 17.7083 17 17.7083Z" fill="white"/></svg>`;

const TAG_HOME_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 7L8 2L14 7" stroke="#1E7A46" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.33333 6.33333V14H12.6667V6.33333" stroke="#1E7A46" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const TAG_WORK_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.66667H4C3.26362 4.66667 2.66667 5.26362 2.66667 6V12C2.66667 12.7364 3.26362 13.3333 4 13.3333H12C12.7364 13.3333 13.3333 12.7364 13.3333 12V6C13.3333 5.26362 12.7364 4.66667 12 4.66667Z" stroke="#6B7772" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 4.66667V2.66667H10V4.66667" stroke="#6B7772" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const TAG_OTHER_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#6B7772" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5.33333H8.00667M7.33333 8H8V10.6667" stroke="#6B7772" stroke-width="1.26667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SLOT_INFO_XML = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.20833 1.41667L2.125 9.91667H7.08333L6.375 15.5833L13.4583 7.08333H8.5L9.20833 1.41667Z" fill="#F5A524"/></svg>`;

/** E5 Payment — cash on delivery icon (Figma MCP export) */
const PAY_COD_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5Z" stroke="#3D4A44" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12.0833C11.1506 12.0833 12.0833 11.1506 12.0833 10C12.0833 8.84941 11.1506 7.91667 10 7.91667C8.84941 7.91667 7.91667 8.84941 7.91667 10C7.91667 11.1506 8.84941 12.0833 10 12.0833Z" stroke="#3D4A44" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10H5.00833M15 10H15.0083" stroke="#3D4A44" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function PaymentCodIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={PAY_COD_XML} width={size} height={size} />;
}

/** E7 Order Confirmed icons (Figma MCP exports) */
const SUCCESS_CHECK_XML = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43.3333 13L19.5 36.8333L8.66667 26" stroke="white" stroke-width="5.63333" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SAVINGS_COIN_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 0.666666V15.3333M11.3333 3.33333H6.33333C5.71449 3.33333 5.121 3.57917 4.68342 4.01675C4.24583 4.45434 4 5.04783 4 5.66667C4 6.28551 4.24583 6.879 4.68342 7.31658C5.121 7.75417 5.71449 8 6.33333 8H9.66667C10.2855 8 10.879 8.24583 11.3166 8.68342C11.7542 9.121 12 9.71449 12 10.3333C12 10.9522 11.7542 11.5457 11.3166 11.9832C10.879 12.4208 10.2855 12.6667 9.66667 12.6667H4" stroke="#C77E12" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const BASKET_SAVE_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2.5H15V17.5L10 14.1667L5 17.5V2.5Z" fill="white" stroke="white" stroke-linejoin="round"/></svg>`;

const TRACK_TRUCK_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 12V2.25H0.75V12H10.5ZM10.5 12H16.5V8.25L14.25 6H10.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 15C5.32843 15 6 14.3284 6 13.5C6 12.6716 5.32843 12 4.5 12C3.67157 12 3 12.6716 3 13.5C3 14.3284 3.67157 15 4.5 15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 15C14.3284 15 15 14.3284 15 13.5C15 12.6716 14.3284 12 13.5 12C12.6716 12 12 12.6716 12 13.5C12 14.3284 12.6716 15 13.5 15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function SuccessCheckIcon({ size = 52 }: IconProps) {
  return <SvgXml xml={SUCCESS_CHECK_XML} width={size} height={size} />;
}

export function SavingsCoinIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={SAVINGS_COIN_XML} width={size} height={size} />;
}

export function BasketSaveIcon({ size = 20 }: IconProps) {
  return <SvgXml xml={BASKET_SAVE_XML} width={size} height={size} />;
}

export function TrackTruckIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={TRACK_TRUCK_XML} width={size} height={size} />;
}

/** E6 Payment Failed icons (Figma MCP exports) */
const PAY_FAILED_X_XML = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M37.5 12.5L12.5 37.5M12.5 12.5L37.5 37.5" stroke="#D8453B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PAY_RETRY_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 9C15.7514 10.5617 15.2112 12.0756 14.2215 13.2837C13.2317 14.4917 11.8537 15.3192 10.3223 15.6252C8.7908 15.9311 7.20063 15.6965 5.82274 14.9614C4.44485 14.2263 3.36449 13.0361 2.76576 11.5937C2.16703 10.1513 2.08698 8.54597 2.53925 7.05117C2.99152 5.55637 3.94812 4.26464 5.24605 3.3961C6.54398 2.52756 8.10292 2.13596 9.65722 2.28801C11.2115 2.44007 12.665 3.12638 13.77 4.23" stroke="white" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.75 3V6.75H12" stroke="white" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function PaymentFailedXIcon({ size = 50 }: IconProps) {
  return <SvgXml xml={PAY_FAILED_X_XML} width={size} height={size} />;
}

export function PaymentRetryIcon({ size = 18 }: IconProps) {
  return <SvgXml xml={PAY_RETRY_XML} width={size} height={size} />;
}

export function MapPinLargeIcon({ size = 34 }: IconProps) {
  return <SvgXml xml={MAP_PIN_LARGE_XML} width={size} height={size} />;
}

export function TagHomeIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={TAG_HOME_XML} width={size} height={size} />;
}

export function TagWorkIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={TAG_WORK_XML} width={size} height={size} />;
}

export function TagOtherIcon({ size = 16 }: IconProps) {
  return <SvgXml xml={TAG_OTHER_XML} width={size} height={size} />;
}

export function SlotInfoIcon({ size = 17 }: IconProps) {
  return <SvgXml xml={SLOT_INFO_XML} width={size} height={size} />;
}
