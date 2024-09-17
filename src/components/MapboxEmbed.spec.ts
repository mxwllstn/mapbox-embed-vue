import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MapboxEmbed from './MapboxEmbed.vue'

const wrapper = mount(MapboxEmbed, {
  propsData: { mapStyle: 'satellite' },
})

it('testing MapboxEmbed component props', async () => {
  expect(wrapper.props().mapStyle).toEqual('satellite')
})
