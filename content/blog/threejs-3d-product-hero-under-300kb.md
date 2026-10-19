---
title: "A 3D product hero with Three.js on a corporate site, kept under 300 KB"
description: "Bhaavya Ecopack's home page opens with a corrugated box you can rotate. It loads in under a second on 4G. Here is how the model, the renderer and the loading were kept small enough for a manufacturing company's site, not a demo."
date: 2027-04-05T03:30:00Z
tags: [threejs, react, nextjs, performance]
keywords: [three.js next.js hero, react three fiber product viewer, optimize glb model size, three.js bundle size, 3d website performance]
project: bhavvya-ecopack
---

A packaging manufacturer wanted visitors to see their product. A photo would have done. A box you can turn with your finger does more, as long as it does not cost the page its load time. The Bhaavya Ecopack hero ships a 3D box at about 280 KB total, including the renderer, and renders the first frame before the text has finished its entrance animation.

## Budget first

I set the budget before writing code: 300 KB of JavaScript and assets for the whole 3D feature, first frame within 1.5 seconds on a throttled 4G connection, and no effect on Largest Contentful Paint, which is the headline text. Everything below followed from that.

## The model

The box was modelled in Blender as a few hundred triangles: a cuboid with bevelled edges and a flap. Corrugation is a normal map, not geometry. Export as glTF binary with Draco compression, textures as 1024 px WebP:

```bash
npx gltf-transform optimize box.glb box.min.glb --compress draco --texture-compress webp --texture-size 1024
```

Before: 4.1 MB. After: 96 KB. The texture is most of that; the geometry is a few kilobytes.

## The renderer, lazily

react-three-fiber plus Three.js is heavy, so it is not in the initial bundle at all:

```tsx
import dynamic from "next/dynamic";
const BoxScene = dynamic(() => import("./box-scene"), { ssr: false, loading: () => <BoxPoster /> });
```

`BoxPoster` is a 20 KB WebP of the box at its default angle, shown immediately. The scene mounts after hydration and replaces the poster with a fade. Visitors see a box within a few hundred milliseconds either way; the interactive one arrives a moment later.

```tsx
// box-scene.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

export default function BoxScene() {
  const { scene } = useGLTF("/models/box.min.glb");
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [2.2, 1.6, 2.8], fov: 35 }} gl={{ antialias: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />
      <primitive object={scene} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}
useGLTF.preload("/models/box.min.glb");
```

`dpr={[1, 1.5]}` caps the pixel ratio; a 3x phone screen rendering at 3x is the fastest way to a hot phone. `Environment` from drei with a small built-in preset gives realistic reflections without shipping an HDR file.

## What it costs in the end

| Piece | Size |
| --- | --- |
| Three.js, r3f, drei (used parts) | ~165 KB gzipped |
| Model with textures | 96 KB |
| Poster image | 20 KB |

All of it loads after the page is interactive. Lighthouse's performance score for the home page stayed above 90 on mobile.

## Rules that kept it from growing

- **No post-processing.** Bloom and depth of field double the cost. The box did not need them.
- **Pause when off screen.** An `IntersectionObserver` sets `frameloop="demand"` when the hero scrolls away, so the GPU stops when nobody is looking.
- **Respect reduced motion.** Auto-rotate is off under `prefers-reduced-motion`; the box still turns if dragged.
- **One model.** The client asked for all 28 products in 3D. The home page shows one; the catalogue shows photos. That decision is why the budget held.

## Sources

- glTF Transform CLI: [gltf-transform.dev/cli](https://gltf-transform.dev/cli)
- react-three-fiber: [r3f.docs.pmnd.rs](https://r3f.docs.pmnd.rs/)
- drei helpers: [github.com/pmndrs/drei](https://github.com/pmndrs/drei)
- Next.js `dynamic` with `ssr: false`: [nextjs.org/docs/app/guides/lazy-loading](https://nextjs.org/docs/app/guides/lazy-loading)
- Three.js performance tips: [threejs.org/manual/#en/optimize-lots-of-objects](https://threejs.org/manual/#en/optimize-lots-of-objects)
