---
title: "Structured data that shows up: Person, Service, FAQ, and how to test them"
description: "Schema.org markup on this site went from a token Person block to six types that match the pages. Here is each one, the JSON it emits, the field that was missing, and the two tools that tell you whether Google can read it."
date: 2027-04-19T03:30:00Z
tags: [seo, structured-data, nextjs, json-ld]
keywords: [schema.org faq json-ld next.js, person structured data portfolio, service schema markup, rich results test, json-ld react component]
image: /blog/stock/writing-2.webp
imageAlt: "Notebook and pen on a desk next to a laptop"
imageCredit: "Shixart1985"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Person_writing_in_a_notebook_while_sitting_at_a_desk.jpg"
imageLicense: "CC BY 2.0"
summary: "Six schema types that match the pages: Person with sameAs, WebSite, Service list, FAQPage, BlogPosting and BreadcrumbList, each emitted as JSON-LD from the page's real data. Validate with the Rich Results Test and the Schema Markup Validator; the missing field was usually a URL."
faq:
  - q: "Which structured data matters for a developer portfolio?"
    a: "Person with sameAs links to your profiles, BlogPosting on posts, BreadcrumbList, and FAQPage where there are real questions. The rest is decoration."
  - q: "How do I test structured data?"
    a: "Google's Rich Results Test shows what is eligible for rich results; the Schema Markup Validator checks the JSON-LD itself."
  - q: "Why did Google not read my Person schema?"
    a: "It had no url field and the name differed from the page. Match the name and give every entity its canonical URL."
---

Structured data is the part of SEO where you can be exactly right or silently wrong, with nothing visible on the page either way. This site emits six schema.org types, each chosen because a page is actually that thing. Here is what each one carries and how I verify it.

## The component

One server component renders any object as a script tag. The replacement of `<` prevents a `</script>` inside a string from breaking out of the tag.

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
```

Pass an array to emit several blocks in one tag. Google reads either.

## Person, on every page

This is what feeds the panel for your name. The fields that made a difference after I added them: `address` with a locality, `worksFor`, `knowsAbout`, and `sameAs` pointing at profiles Google already trusts.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Paresh Suthar",
  "jobTitle": "Full Stack Developer",
  "url": "https://pareshsuthar.vercel.app",
  "image": "https://.../profile.webp",
  "address": { "@type": "PostalAddress", "addressLocality": "Surat", "addressRegion": "Gujarat", "addressCountry": "IN" },
  "worksFor": { "@type": "Organization", "name": "JBV Share Broker & Fintech / Growth Avenues", "url": "https://www.growthavenues.in" },
  "knowsAbout": ["React", "Node.js", "MongoDB", "PostgreSQL", "React Native", "Nginx"],
  "sameAs": ["https://github.com/pareshsutharr", "https://www.linkedin.com/in/...", "https://www.youtube.com/@..."]
}
```

## ProfilePage, on the About page

Wraps the Person as `mainEntity` with `dateModified`. It tells Google this is the page about the person, which matters when several pages mention you.

## Service, as an ItemList on the Services page

Each service is a `Service` with `provider` pointing at the Person and `areaServed`. The list form keeps order:

```json
{
  "@type": "ItemList",
  "itemListElement": [{
    "@type": "ListItem", "position": 1,
    "item": { "@type": "Service", "name": "Full Stack Development", "serviceType": "Full Stack Development",
              "areaServed": ["Surat", "Gujarat", "India", "Remote"], "provider": { "@type": "Person", "name": "Paresh Suthar" } }
  }]
}
```

## FAQPage, only where there is a visible FAQ

Google requires the questions and answers to be visible on the page in the same words. Markup for an FAQ that is not on the page is a policy violation. The Services page has six real questions; the JSON mirrors them exactly.

## BlogPosting, on each post

`headline`, `datePublished`, `dateModified`, `author` as a Person with a URL, and `image`. The image is the generated cover, 1200 by 630, which also serves as the Open Graph image. `wordCount` and `keywords` are optional and cheap.

## BreadcrumbList, on inner pages

Home, section, page. This is the one that changes what the result looks like in search: the grey path under the title.

## Testing

1. **Rich Results Test** at search.google.com/test/rich-results. Paste the URL. It tells you which types were detected and which are eligible for rich results. "Detected but not eligible" is normal for Person and Service; "errors" is not.
2. **Schema Markup Validator** at validator.schema.org. Stricter about vocabulary. It caught a `Service` where I had used `serviceArea` instead of `areaServed`.
3. **Search Console, Enhancements.** After indexing, it reports FAQ and breadcrumb items it found and any it rejected. This is the only one that reflects what Google really stored.

A habit that saves time: after any change to a page's structured data, `curl` the page, extract the script blocks and run them through `JSON.parse`. A trailing comma fails silently in the browser and loudly in the validator.

```bash
curl -s https://pareshsuthar.vercel.app/services | grep -o '<script type="application/ld+json">[^<]*' | sed 's/<script type="application\/ld+json">//' | node -e 'process.stdin.on("data",d=>{try{JSON.parse(d);console.log("ok")}catch(e){console.log("BAD",e.message)}})'
```

## Sources

- Google structured data general guidelines: [developers.google.com/search/docs/appearance/structured-data/sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- FAQ structured data: [developers.google.com/search/docs/appearance/structured-data/faqpage](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- Article structured data: [developers.google.com/search/docs/appearance/structured-data/article](https://developers.google.com/search/docs/appearance/structured-data/article)
- Schema.org Person: [schema.org/Person](https://schema.org/Person)
- Schema Markup Validator: [validator.schema.org](https://validator.schema.org/)
