// Help for players whose phone or browser blocks location.
// Plain functions, so they can be tested in tests/location.test.js.

// The browser gives error code 1 (PERMISSION_DENIED) when the player, or a
// setting, has blocked location for this website. Other errors (no signal,
// timeout) usually fix themselves, so we only explain the blocked case.
export const PERMISSION_DENIED = 1

export function isLocationBlocked(errorCode) {
  return errorCode === PERMISSION_DENIED
}

// The help under "How to turn it on?" on the map (the note itself only says
// "Location is off 📍"). `host` is the website's address, e.g.
// "lisboa-explora.vercel.app", so it is also right on previews and localhost.
export function locationOffMessage(host) {
  return `Allow location for ${host} in your settings, then reload the page.`
}

// Where to switch location back on, per device.
export const LOCATION_STEPS = [
  { device: 'iPhone', steps: 'Settings → Privacy & Security → Location Services → Safari Websites → While Using the App' },
  { device: 'Android', steps: 'Tap the icon left of the address bar → Permissions → Location → Allow' },
  { device: 'Computer', steps: 'Click the icon left of the address bar → Location → Allow' },
]
