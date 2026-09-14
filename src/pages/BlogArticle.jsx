import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Quote, UserRound } from 'lucide-react';
import Seo from '../components/Seo';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import NewsletterSignup from '../components/NewsletterSignup';
import CTA from '../components/CTA';
import { BLOG_POSTS, COMPANY } from '../utils/constants';
import { BLOG_CONTENT } from '../utils/blogContent';

const SITE = 'https://ledgeroofing.org';

function absoluteImage(path) {
  return `${SITE}${encodeURI(path)}`;
}

export default function BlogArticle() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const content = BLOG_CONTENT[slug];

  if (!post || !content) {
    return <Navigate to="/blog" replace />;
  }

  const canonical = `/blog/${slug}`;
  const title = `${post.title} | Ledge Roofing`;
  const imageUrl = absoluteImage(post.image);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}${canonical}` },
      headline: post.title,
      description: post.excerpt,
      image: [imageUrl],
      datePublished: post.published,
      dateModified: post.published,
      author: {
        '@type': 'Organization',
        name: post.author || 'Ledge Roofing',
        url: SITE,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Ledge Roofing',
        url: SITE,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE}/images/logo.png`,
        },
      },
      articleSection: post.category,
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}${canonical}` },
      ],
    },
  ];

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Seo
        title={title}
        description={post.excerpt}
        path={canonical}
        image={imageUrl}
        type="article"
        publishedTime={post.published}
        modifiedTime={post.published}
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow="Blog"
        title={
          <>
            {post.title.split(':')[0]}
            {post.title.includes(':') && <span className="text-white/55">: {post.title.split(':')[1]}</span>}
          </>
        }
        text={post.excerpt}
      />

      <article className="relative py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-[0.3]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 lg:px-8">
          <Reveal direction="up">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-primary" /> {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-red-400" /> {post.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-red-400" /> {post.read}
              </span>
              <span className="rounded-full bg-red-50 px-3 py-1 font-display text-xs font-bold uppercase tracking-wider text-primary">
                {post.tag}
              </span>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.08} className="mt-8">
            <img
              src={post.image}
              alt={post.title}
              className="aspect-[16/9] w-full rounded-[2rem] object-cover shadow-float"
              loading="eager"
            />
          </Reveal>

          <Reveal direction="up" delay={0.12}>
            <p className="mt-10 text-lg leading-relaxed text-charcoal">{content.intro}</p>
          </Reveal>

          <div className="mt-12 space-y-12">
            {content.sections.map((section) => (
              <Reveal key={section.h2} direction="up">
                <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{section.h2}</h2>
                <div className="mt-5 space-y-5">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.tip && (
                  <div className="mt-6 flex items-start gap-4 rounded-2xl border-l-4 border-primary bg-mist/70 p-6">
                    <Quote className="h-6 w-6 shrink-0 text-primary/40" />
                    <div>
                      <div className="font-display text-sm font-bold text-primary">Pro Tip</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{section.tip}</p>
                    </div>
                  </div>
                )}
              </Reveal>
            ))}
          </div>

          <Reveal direction="up" className="mt-14">
            <div className="rounded-[2rem] bg-ink p-9 text-white shadow-float sm:p-10">
              <h2 className="font-display text-2xl font-bold">The Bottom Line</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75">{content.takeaway}</p>
            </div>
          </Reveal>

          <Reveal direction="up" className="mt-10">
            <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-line bg-white p-9 shadow-card sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Need a professional opinion?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Get a free, no-obligation inspection and an honest written estimate.
                </p>
              </div>
              <a
                href={COMPANY.phoneHref}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                WhatsApp: {COMPANY.phone}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal direction="up" className="mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all articles
            </Link>
          </Reveal>
        </div>
      </article>

      {related.length > 0 && (
        <section className="relative bg-mist/60 py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal direction="up">
              <h2 className="font-display text-3xl font-bold text-ink">Keep Reading</h2>
            </Reveal>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {related.map((relatedPost) => (
                <Reveal key={relatedPost.slug} direction="up">
                  <Link
                    to={`/blog/${relatedPost.slug}`}
                    className="group block overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-float"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="h-48 w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                        loading="lazy"
                      />
                      <span className="absolute left-5 top-5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-glow">
                        {relatedPost.tag}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-primary">
                        {relatedPost.title}
                      </h3>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3.5">
                        Read Article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterSignup />

      <CTA />
    </>
  );
}