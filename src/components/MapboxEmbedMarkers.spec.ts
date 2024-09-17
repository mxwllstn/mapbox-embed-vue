import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MapboxEmbedMarkers from '../components/MapboxEmbedMarkers.vue'

const wrapper = mount(MapboxEmbedMarkers, {
  propsData: { mapStyle: 'satellite' },
})

it('testing MapboxEmbedMarkers component props', async () => {
  expect(wrapper.props().mapStyle).toEqual('satellite')
})
