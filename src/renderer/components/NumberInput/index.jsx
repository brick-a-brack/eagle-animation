import React from 'react';

import * as styleCss from './style.module.css';

const setValueAndEmitEvent = (dom, value) => {
    // React hacky stuff to simulate onChange event
    // See: https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

    nativeInputValueSetter.call(dom, value);
    var ev2 = new Event('input', { bubbles: true });
    dom.dispatchEvent(ev2);
}

const NumberInput = ({ register = {}, className = '', tag = '', style = {}, min = -Infinity, max = Infinity, onFocus, onBlur, onValueChange = null, ...rest }) => {
    const handleButtonClick = (applyValue = 0) => (evt) => {
        const dom = evt?.target?.parentNode?.querySelector('input');

        if (!dom) {
            return;
        }

        const value = Math.min(max, Math.max(min, (parseInt(dom.value, 10) + applyValue) || 0));

        if (onValueChange) {
            onValueChange(value);
        }

        setValueAndEmitEvent(dom, value)
    }


    const handleFocus = (evt) => {
        if (register.onFocus) {
            register.onFocus(evt);
        }

        if (onFocus) {
            onFocus(evt);
        }
    }

    const handleBlur = (evt) => {
        const dom = evt?.target?.parentNode?.querySelector('input');

        if (!dom) {
            return;
        }

        dom.value = Math.min(max, Math.max(min, (parseInt(dom.value, 10)) || 0));

        if (onValueChange) {
            onValueChange(dom.value);
        }

        if (register.onBlur) {
            register.onBlur(evt);
        }

        if (onBlur) {
            onBlur(evt);
        }
    }

    return <div className={`${styleCss.container} ${!tag ? styleCss.noTag : ''}`} style={style} >
        <button onKeyDown={(e) => { e.preventDefault(); }} type="button" className={styleCss.button} onClick={handleButtonClick(-1)}>-</button>
        <label className={styleCss.field}>
            <input min={min} max={max} type="number" className={`${styleCss.input} ${className}`} {...rest} {...register} onBlur={handleBlur} onFocus={handleFocus} />
            {tag && <span className={styleCss.tag}>{tag}</span>}
        </label>
        <button onKeyDown={(e) => { e.preventDefault(); }} type="button" className={styleCss.button} onClick={handleButtonClick(1)}>+</button>
    </div>
};

export default React.memo(NumberInput);