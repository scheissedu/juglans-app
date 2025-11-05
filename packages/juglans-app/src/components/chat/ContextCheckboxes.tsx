// /klinecharts-workspace/packages/preview/src/ContextCheckboxes.tsx

import { Component, JSX } from 'solid-js';
import { Checkbox } from '@klinecharts/pro';
import './ContextCheckboxes.css';

interface ContextCheckboxesProps {
  marketContextChecked: boolean;
  myContextChecked: boolean;
  onMarketContextChange: (checked: boolean) => void;
  onMyContextChange: (checked: boolean) => void;
}

const ContextCheckboxes: Component<ContextCheckboxesProps> = (props) => {
  return (
    <div class="context-checkboxes">
      <Checkbox 
        label="Market Context"
        checked={props.marketContextChecked}
        onChange={props.onMarketContextChange}
      />
      <Checkbox 
        label="My Context"
        checked={props.myContextChecked}
        onChange={props.onMyContextChange}
      />
    </div>
  );
};

export default ContextCheckboxes;