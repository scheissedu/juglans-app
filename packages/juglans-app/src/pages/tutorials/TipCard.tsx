// packages/juglans-app/src/pages/tutorials/TipCard.tsx
import { Component, Show } from 'solid-js';
import { A } from '@solidjs/router'; // Import the A component
import type { TutorialTip } from './data';
import InlineSvg from '../../components/common/InlineSvg';

interface TipCardProps {
  tip: TutorialTip;
}

const TipCard: Component<TipCardProps> = (props) => {
  const isSvg = () => props.tip.image.endsWith('.svg');

  return (
    // --- 核心修改: Wrap the entire card in an <A> tag ---
    <A href={`/articles/${props.tip.slug}`} class="tip-card">
      <div class="tip-card-image-wrapper">
        <Show
          when={isSvg()}
          fallback={
            <img 
              src={props.tip.image} 
              alt={props.tip.title} 
              class="tip-card-image" 
            />
          }
        >
          <InlineSvg 
            src={props.tip.image}
            class="tip-card-image"
          />
        </Show>
      </div>
      <div class="tip-card-content">
        <h3 class="tip-card-title">{props.tip.title}</h3>
        <p class="tip-card-description">{props.tip.description}</p>
      </div>
    </A>
  );
};

export default TipCard;