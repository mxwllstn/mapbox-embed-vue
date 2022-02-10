# mapbox-embed (Vue component)
Vue component that embeds a mapbox map with a marker

## Usage

#### Component
```vue
<MapboxEmbed 
  coordinates="34.077072, -118.269450"
  map-style="satellite-streets"
  zoom="15"
  :access-token="pk.abc123"
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
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production
$ yarn build

# preview production build
$ yarn preview --host

```
