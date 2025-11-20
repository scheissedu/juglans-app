import { Component } from 'solid-js';

const GridIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zm6 0h4v4h-4V3zM3 9h4v4H3V9zm6 0h4v4H9V9zm6 0h4v4h-4V9zm-6 6h4v4H9v-4zm-6 0h4v4H3v-4zm12 0h4v4h-4v-4z"/>
  </svg>
);

export default GridIcon;