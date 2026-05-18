'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface AuthPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: 'split' | 'card';
  /** Overlay text on the side image (split variant only) */
  sideTitle?: string;
  /** Subtitle for the side image overlay (split variant only) */
  sideSubtitle?: string;
  /** Side image source (split variant only). Defaults to login/register side image. */
  sideImageSrc?: string;
  /** Href for the "back to login" link at the top. If omitted, no back link is shown. */
  backHref?: string;
}

/**
 * Shared outer shell for all auth pages (login, register, verify-email, callback,
 * forgot-password, reset-password, resend-verification).
 *
 * Handles: full-page background image, motion card container, split-panel layout
 * (login/register) or centered card layout (all others), and optional back link.
 */
export default function AuthPageLayout({
  children,
  title,
  subtitle,
  variant = 'card',
  sideTitle,
  sideSubtitle,
  sideImageSrc = '/assets/loginRegister/login-side.png',
  backHref,
}: AuthPageLayoutProps) {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/loginRegister/background-travel.png"
          alt="Background"
          fill
          sizes="100vw"
          className="object-cover brightness-[0.7]"
          priority
        />
      </div>

      {/* CARD CONTAINER */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`relative z-10 w-full bg-white rounded-3xl shadow-2xl overflow-hidden ${
          variant === 'split'
            ? 'max-w-5xl flex flex-col md:flex-row min-h-[600px]'
            : 'max-w-md p-8 md:p-12'
        }`}
      >
        {/* SPLIT VARIANT: Left side image */}
        {variant === 'split' && (
          <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              <Image
                src={sideImageSrc}
                alt="Side"
                fill
                sizes="50vw"
                className="object-cover"
              />
            </motion.div>
            {(sideTitle || sideSubtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12 pointer-events-none">
                <motion.h2
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white text-3xl font-bold leading-tight"
                >
                  {sideTitle && (
                    <span className="font-serif">
                      {sideTitle}
                      <br />
                    </span>
                  )}
                  {sideSubtitle && (
                    <span className="font-light text-white/80">{sideSubtitle}</span>
                  )}
                </motion.h2>
              </div>
            )}
          </div>
        )}

        {/* RIGHT CONTENT (split) or FULL CONTENT (card) */}
        <div
          className={
            variant === 'split'
              ? 'w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center'
              : ''
          }
        >
          {/* BACK LINK (optional) */}
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al login
            </Link>
          )}

          {/* TITLE + SUBTITLE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={variant === 'split' ? 'mb-10' : ''}
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{title}</h1>
            <p className={`text-gray-500 ${variant === 'split' ? 'text-lg' : ''}`}>{subtitle}</p>
          </motion.div>

          {children}
        </div>
      </motion.div>
    </main>
  );
}
