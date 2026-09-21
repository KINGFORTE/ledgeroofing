import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Music2, Bookmark, Home, Search, PlusSquare } from 'lucide-react';
import PageHero from '../components/PageHero';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import CTA from '../components/CTA';
import Seo from '../components/Seo';
import { COMPANY } from '../utils/constants';
import { staggerContainer, fadeUp } from '../utils/motion';
const ogImage = '/images/og-ledge.jpg';

import shot1 from '../../project media for web - Copy/Green Park/images/IMG_7834.JPEG';
import shot2 from '../../project media for web - Copy/Nautica Beach/images/IMG_5883.JPEG';
import shot3 from '../../project media for web - Copy/Alfred Court Project/images/IMG_3628.JPEG';
import shot4 from '../../project media for web - Copy/Niger Dock Factory_/images/IMG_6811.JPEG';
import shot5 from '../../project media for web - Copy/Lutos Capital Bank/images/IMG_8601.JPEG';
import shot6 from '../../project media for web - Copy/koko beach resort/pictures/IMG_1628.JPEG';
import shot7 from '../../project media for web - Copy/Medbury Hospital/images/IMG_7536.JPEG';
import shot8 from '../../project media for web - Copy/Alausa heights_/images/IMG_5477.JPEG';
import shot9 from '../../project media for web - Copy/Green Park/images/IMG_7795.JPEG';
import shot10 from '../../project media for web - Copy/Green Park/images/IMG_7862.JPEG';
import shot11 from '../../project media for web - Copy/Alfred Court Project/images/IMG_3840.JPEG';
import shot12 from '../../project media for web - Copy/lagos mall project/images/IMG_1743.JPG';
import shot13 from '../../project media for web - Copy/Alfred Court Project/images/IMG_3824.JPEG';
import shot14 from '../../project media for web - Copy/lagos mall project/images/IMG_1750.JPG';
import shot15 from '../../project media for web - Copy/Nautica Beach/images/IMG_5189.JPEG';
import shot16 from '../../project media for web - Copy/lagos mall project/images/IMG_1745.JPG';
import shot17 from '../../project media for web - Copy/lagos mall project/images/IMG_1747.JPG';
import shot18 from '../../project media for web - Copy/Niger Dock Factory_/images/IMG_6818.JPEG';
import shot19 from '../../project media for web - Copy/lagos mall project/images/IMG_1749.JPG';
import shot20 from '../../project media for web - Copy/lagos mall project/images/IMG_1744.JPG';

import reel1 from '../../hero-videos/IMG_7538.MP4';
import reel2 from '../../hero-videos/IMG_6799.MP4';
import reel3 from '../../hero-videos/IMG_7697.MP4';

function InstagramIcon({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 448 512" className={`${className} fill-current`} aria-hidden="true">
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
  );
}

function TikTokIcon({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 448 512" className={`${className} fill-current`} aria-hidden="true">
      <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z" />
    </svg>
  );
}

const marqueeShots = [
  shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot8, shot9, shot10,
  shot15, shot16, shot17, shot18, shot19, shot20,
];

const igGrid = [shot9, shot3, shot5, shot12, shot1, shot2, shot8, shot6, shot4, shot11, shot13, shot14];

const reels = [
  { video: reel1, likes: '12.4K', comments: '310' },
  { video: reel2, likes: '8.9K', comments: '204' },
  { video: reel3, likes: '21.7K', comments: '486' },
];

export default function Socials() {
  return (
    <>
      <Seo
        title="Follow Ledge Roofing on Social Media | Instagram & TikTok"
        description="Follow Ledge Roofing on Instagram and TikTok — behind-the-scenes builds, finished roof projects, tips and roofing fun from Lagos, Nigeria."
        path="/socials"
      />

      <PageHero
        eyebrow="Our Socials"
        title={
          <>
            Follow The Build
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Wherever You Scroll.
            </span>
          </>
        }
        text="Behind-the-scenes builds, finished roofs and the crew that gets it done — swipe through our real projects on Instagram and TikTok."
      />

      <section className="relative overflow-hidden bg-ink py-10">
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-5">
            {[...marqueeShots, ...marqueeShots].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="h-40 w-56 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-24 text-white lg:py-32">
        <div className="grid-lines-dark absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-pink-600/20 blur-[140px]" aria-hidden="true" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-[120px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Follow & Connect"
            title="Two Channels, One Obsession"
            text="Tap through to see real Ledge Roofing projects — the materials, the crews and the finished roofs."
            dark
          />

          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-20 grid items-center gap-16 lg:grid-cols-2"
          >
            <motion.div variants={fadeUp} className="mx-auto w-full max-w-[400px]">
              <div className="relative">
                <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-tr from-[#fd5949]/40 via-[#d6249f]/35 to-[#285AEB]/40 blur-2xl" aria-hidden="true" />

                <div className="relative overflow-hidden rounded-[2.75rem] border border-white/15 bg-[#0a0a0a] shadow-float">
                  <div className="flex items-center gap-2 border-b border-white/10 px-5 pb-3 pt-5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#fe5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-4 hidden flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/40 sm:flex">
                      <Search className="h-3 w-3" />
                      ledgeroofing
                    </span>
                  </div>

                  <div className="flex items-center gap-4 px-5 py-5">
                    <span className="shrink-0 rounded-full bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] p-[3px]">
                      <img
                        src={ogImage}
                        alt="Ledge Roofing profile"
                        className="h-16 w-16 rounded-full border-2 border-[#0a0a0a] object-cover"
                      />
                    </span>
                    <div className="flex-1">
                      <div className="font-display text-sm font-semibold text-white">ledgeroofing</div>
                      <div className="text-xs text-white/50">Ledge Roofing • Lagos</div>
                    </div>
                    <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Follow</span>
                  </div>

                  <div className="flex justify-center gap-7 border-y border-white/10 px-5 py-3 text-center">
                    {[
                      ['140', 'Posts'],
                      ['790', 'Followers'],
                      ['74', 'Following'],
                    ].map(([val, label]) => (
                      <div key={label}>
                        <div className="font-display text-sm font-bold text-white">{val}</div>
                        <div className="text-[0.65rem] text-white/50">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-[3px] p-[3px]">
                    {igGrid.map((src, i) => (
                      <span key={i} className="relative aspect-square overflow-hidden">
                        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                        {i === 1 && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Play className="h-6 w-6 fill-white/80 text-white/80" />
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-dark absolute -right-6 -top-8 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-float animate-float">
                  <Heart className="h-4 w-4 fill-[#ff2e63] text-[#ff2e63]" />
                  <span className="text-xs font-bold text-white">12.4K likes</span>
                </div>
                <div className="glass-dark absolute -left-8 bottom-16 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-float animate-float" style={{ animationDelay: '1.6s' }}>
                  <img src={shot6} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <div className="text-xs font-bold text-white">New reel!</div>
                    <div className="text-[0.7rem] text-white/60">Badagry beach resort</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fd5949] via-[#d6249f] to-[#285AEB] p-4 text-white shadow-2xl">
                <InstagramIcon />
              </span>
              <h3 className="mt-6 font-display text-3xl font-bold text-white">
                Instagram <span className="text-white/40">· @ledgeroofing</span>
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
                Daily posts, reels and stories straight from our jobsites — finished roofs, crews at work and
                before-and-after transformations across Lagos. DM us anytime, we love talking roofing.
              </p>
              <ul className="mt-7 flex flex-wrap gap-3">
                {['Project reels', 'Before & after', 'Crew content', 'Quick tips'].map((tag) => (
                  <li key={tag} className="rounded-full border border-[#d6249f]/40 bg-[#d6249f]/10 px-4 py-2 text-xs font-semibold text-pink-200">
                    {tag}
                  </li>
                ))}
              </ul>
              <a
                href={COMPANY.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#fd5949] via-[#d6249f] to-[#285AEB] px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:scale-[1.03]"
              >
                Follow On Instagram
                <Share2 className="h-4 w-4" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-28 grid items-center gap-16 lg:grid-cols-2"
          >
            <motion.div variants={fadeUp} className="order-2 lg:order-1">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00f2ea] via-[#25f4ee] to-[#fe2c55] p-4 text-white shadow-2xl">
                <TikTokIcon />
              </span>
              <h3 className="mt-6 font-display text-3xl font-bold text-white">
                TikTok <span className="text-white/40">· @ledgeroofing</span>
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
                Fast, fun roofing content — timelapses, myths, height-fear jokes and satisfying finishes built
                for your For You page. Join a community that actually gets excited about roofs.
              </p>
              <ul className="mt-7 flex flex-wrap gap-3">
                {['Roof timelapses', 'Roofing myths', 'Satisfying finishes', 'Crew POV'].map((tag) => (
                  <li key={tag} className="rounded-full border border-[#25f4ee]/40 bg-[#25f4ee]/10 px-4 py-2 text-xs font-semibold text-cyan-200">
                    {tag}
                  </li>
                ))}
              </ul>
              <a
                href={COMPANY.social.tiktok}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00f2ea] via-[#25f4ee] to-[#fe2c55] px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:scale-[1.03]"
              >
                Follow On TikTok
                <Share2 className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="order-1 mx-auto w-full max-w-[400px] lg:order-2">
              <div className="relative">
                <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-tr from-[#00f2ea]/35 via-[#25f4ee]/25 to-[#fe2c55]/40 blur-2xl" aria-hidden="true" />

                <div className="relative overflow-hidden rounded-[2.75rem] border border-white/15 bg-[#0a0a0a] shadow-float">
                  <div className="flex items-center gap-2 px-5 pb-3 pt-5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#fe5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>

                  <div className="relative flex h-[520px] items-center justify-center">
                    {reels.map(({ video }, i) => (
                      <video
                        key={video}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={shot4}
                        aria-hidden={i !== 0}
                        className={`absolute inset-0 h-full w-full object-cover ${i === 0 ? 'opacity-100' : 'opacity-0'}`}
                      >
                        <source src={video} type="video/mp4" />
                      </video>
                    ))}

                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                      <Home className="h-3.5 w-3.5 text-cyan-300" />
                      <span className="text-xs font-semibold text-white">For You</span>
                    </div>

                    <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5">
                      {[
                        { icon: Heart, label: reels[0].likes, cls: 'text-[#fe2c55]' },
                        { icon: MessageCircle, label: reels[0].comments, cls: 'text-white' },
                        { icon: Bookmark, label: 'Save', cls: 'text-white' },
                        { icon: Share2, label: 'Share', cls: 'text-white' },
                      ].map(({ icon: Icon, label, cls }, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                            <Icon className={`h-5 w-5 ${cls}`} />
                          </span>
                          <span className="text-[0.65rem] font-semibold text-white/80">{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-5 left-5 right-16">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <img src={ogImage} alt="" className="h-6 w-6 rounded-full object-cover" />
                        @ledgeroofing
                        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem]">
                          <PlusSquare className="h-3 w-3" />
                          Follow
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-white/85">
                        Standing seam going down on a Badagry beach resort 🏝️#roofing #construction #lagos
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-[0.7rem] text-white/60">
                        <Music2 className="h-3 w-3" />
                        original sound – Ledge Roofing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-dark absolute -left-6 -top-8 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-float animate-float" style={{ animationDelay: '0.8s' }}>
                  <Music2 className="h-4 w-4 text-[#25f4ee]" />
                  <span className="text-xs font-bold text-white">Trending #roofing</span>
                </div>
                <div className="glass-dark absolute -right-8 bottom-16 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-float animate-float" style={{ animationDelay: '2.2s' }}>
                  <Play className="h-4 w-4 fill-[#fe2c55] text-[#fe2c55]" />
                  <span className="text-xs font-bold text-white">1.2M views</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <Reveal direction="up" delay={0.2} className="mt-20 text-center">
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/50">
              Tag <span className="font-semibold text-white">{COMPANY.name}</span> in your roof photos — we
              reshare the best ones on both channels. New posts go live weekly, so hit follow before the next
              reveal.
            </p>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}