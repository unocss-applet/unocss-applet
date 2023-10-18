# @unocss-applet/reset/uni-app/tailwind.md

Based on [Tailwind's preflight](https://tailwindcss.com/docs/preflight), in static forms.

## Changes

### Static

This is provided as a static version of Tailwind's preflight, so it doesn't inherit any styles from the theme.

### Border color

In Tailwind's preflight, the border color default border color is read from the theme borderColor.DEFAULT. To customize it in Uno's reset, we use CSS variable instead:

```css
@import '@unocss-applet/reset/uni-app/tailwind.css';

:root {
  --un-default-border-color: #e5e7eb;
}
```

### Cross-platform compatibility

We add conditional compilation in style files to bring cross-platform compatibility.
