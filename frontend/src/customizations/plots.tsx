import React from 'react';

export class SvgElement<ElementType> {
    public constructor(public name: string,
        public svg?: React.SVGProps<ElementType>) {
    }
}

export const markers = [
    new SvgElement('circle', <svg></svg>),
    new SvgElement('square'),
    new SvgElement('diamond'),
    new SvgElement('cross'),
    new SvgElement('x'),
    new SvgElement('triangle-up'),
    new SvgElement('triangle-right'),
    new SvgElement('pentagon'),
    new SvgElement('hexagon'),
    new SvgElement('asterisk'),
];

export const colors = ['blue', 'cyan', 'red', 'yellow', 'green', 'grey', 'black', 'brown', 'purple', 'orange'];

export const lineStyles = [
    new SvgElement<SVGPathElement>('solid', <path d="M5,0h30" fill="none" stroke="rgb(31, 119, 180)" stroke-opacity="1" stroke-width="4px"></path>),
    new SvgElement<SVGPathElement>('dot', <path d="M5,0h30" fill="none" stroke="rgb(31, 119, 180)" stroke-opacity="1" stroke-width="4px" stroke-dasharray="4px, 4px"></path>),
    new SvgElement<SVGPathElement>('dash', <path d="M5,0h30" fill="none" stroke="rgb(31, 119, 180)" stroke-opacity="1" stroke-width="4px" stroke-dasharray="12px, 12px"></path>),
    new SvgElement<SVGPathElement>('dashdot', <path d="M5,0h30" fill="none" stroke="rgb(31, 119, 180)" stroke-opacity="1" stroke-width="4px" stroke-dasharray="12px, 4px, 4px, 4px"></path>),
]