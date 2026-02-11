'use client';

import * as React from 'react';

type ProductConfig = {
  name?: string;
  description?: string;
  price?: number;
  interval?: string;
};

type CheckoutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  productConfig?: ProductConfig;
};

type PortalButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CheckoutButton(props: CheckoutButtonProps) {
  const { children, productConfig: _productConfig, ...rest } = props;
  return (
    <button type="button" {...rest}>
      {children ?? 'Subscribe'}
    </button>
  );
}

export function PortalButton(props: PortalButtonProps) {
  const { children, ...rest } = props;
  return (
    <button type="button" {...rest}>
      {children ?? 'Manage billing'}
    </button>
  );
}
