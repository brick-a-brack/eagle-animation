import React from 'react';
import * as style from './style.module.css';

const headings = {
  1: ({ ...props }) => <h1 {...props} />,
  2: ({ ...props }) => <h2 {...props} />,
  3: ({ ...props }) => <h3 {...props} />,
  4: ({ ...props }) => <h4 {...props} />,
  5: ({ ...props }) => <h5 {...props} />,
  6: ({ ...props }) => <h6 {...props} />,
  fallback: ({ ...props }) => <div {...props} />,
};

const Heading = ({ h = 1, seo = h, className = '', ...props }) => {
  const Head = headings[Number(seo)] || headings.fallback;
  return <Head className={`${style[`h${h}`]} ${className}`} {...props} />;
};

export default React.memo(Heading);
