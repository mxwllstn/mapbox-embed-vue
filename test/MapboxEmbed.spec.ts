import { MapboxEmbed } from '@mxwllstn/mapbox-embed-vue'
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

const wrapper = mount(MapboxEmbed, {
  props: { mapStyle: 'satellite' },
})

it('testing MapboxEmbed component props', async () => {
  expect(wrapper.props().mapStyle).toEqual('satellite')
})
