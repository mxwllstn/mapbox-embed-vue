import { MapboxEmbedMarkers } from '@mxwllstn/mapbox-embed-vue'
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

const wrapper = mount(MapboxEmbedMarkers, {
  props: { mapStyle: 'satellite' },
})

it('testing MapboxEmbedMarkers component props', async () => {
  expect(wrapper.props().mapStyle).toEqual('satellite')
})
