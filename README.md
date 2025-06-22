# mapbox-embed-vue
Vue component for using mapbox

## Usage

#### Component
```vue
<MapboxEmbed
  coordinates="34.077072, -118.269450"
  map-style="satellite-streets"
  zoom="15"
  access-token="pk.abc123"
/>
```

#### Map Styles
```ts
export type Styles =
  | 'streets'
  | 'outdoors'
  | 'light'
  | 'dark'
  | 'satellite'
  | 'satellite-streets'
  | 'navigation-day'
  | 'navigation-night'
```

## Development Setup (Vue + Vite)

```bash
# install dependencies
$ pnpm i

# serve with hot reload
$ pnpm run dev

# build for production
$ pnpm run build

# preview production build
$ pnpm run preview

```
