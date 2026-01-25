// src/screens/Home/constants.ts
export const GREY_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [{ saturation: -100 }, { lightness: 10 }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ saturation: -100 }, { lightness: 30 }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ saturation: -100 }, { lightness: 80 }],
  },
  { featureType: "poi", stylers: [{ saturation: -100 }, { lightness: 20 }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ saturation: -100 }, { lightness: 15 }],
  },
  {
    featureType: "water",
    stylers: [{ saturation: -100 }, { lightness: -10 }],
  },
];

export const DEFAULT_AUTOCOMPLETE_RADIUS = 20000;

export const DEFAULT_INITIAL_REGION = {
  latitude: 32.977,
  longitude: -96.735,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const ZOOM_TO_SAVED_SPOT = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const ZOOM_TO_GOOGLE_PLACE = {
  latitudeDelta: 0.0015,
  longitudeDelta: 0.0015,
};
