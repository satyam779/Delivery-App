import Image from 'next/image';
import Link from 'next/link';

const features = [
  'Fresh food',
  'Fast delivery',
  'Live tracking',
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_30%),linear-gradient(180deg,_#fff9f4_0%,_#ffffff_45%,_#fff4e8_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-orange-100 bg-white p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8">
          <div className="absolute -left-10 top-10 hidden h-32 w-32 rounded-full bg-orange-200/50 blur-3xl sm:block" />
          <div className="absolute -right-8 bottom-8 hidden h-36 w-36 rounded-full bg-amber-200/50 blur-3xl sm:block" />

          <div className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">Food Delivery</p>
              <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-black sm:text-5xl lg:text-6xl">
                Fresh food, packed fast, delivered right.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-gray-700 sm:text-lg">
                Discover quick bites, full meals, and drinks in one place with smooth ordering and live delivery updates.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="rounded-xl bg-black px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Browse Food
                </Link>
                <Link
                  href="/grocery"
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-gray-50"
                >
                  Grocery Store
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-black"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="relative min-h-[280px] overflow-hidden rounded-[1.75rem] sm:min-h-[360px]">
                  <Image
                    src="/biryani.jpg"
                    alt="Biryani"
                    fill
                    priority
                    sizes="(min-width: 1024px) 35vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Top Pick</p>
                    <h2 className="mt-2 text-3xl font-bold">Biryani</h2>
                    <p className="mt-2 text-sm text-white/85">Rich flavor, satisfying portion, delivery-ready.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="relative min-h-[170px] overflow-hidden rounded-[1.75rem]">
                    <Image
                      src="/egg-puff.jpg"
                      alt="Egg Puff"
                      fill
                      sizes="(min-width: 1024px) 18vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h3 className="text-xl font-semibold">Egg Puff</h3>
                    </div>
                  </div>


                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[150px] overflow-hidden rounded-[1.75rem]">
                  <Image
                    src="/coke.jpg"
                    alt="Cool Drinks"
                    fill
                    sizes="(min-width: 1024px) 20vw, 100vw"
                    loading="eager"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-lg font-semibold">Cool Drinks</h3>
                  </div>
                </div>
                <div className="relative min-h-[150px] overflow-hidden rounded-[1.75rem]">
                  <Image
                    src="/chicken burger.webp"
                    alt="Cool Drinks"
                    fill
                    sizes="(min-width: 1024px) 20vw, 100vw"
                    loading="eager"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-lg font-semibold">Burger</h3>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm sm:mt-12 sm:p-6 lg:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
            <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-[1.5rem] border border-orange-100 bg-orange-50 shadow-sm md:mx-0 md:h-64 md:w-64">
              <Image
                src="/satya.jpeg"
                alt="Satya"
                fill
                sizes="(min-width: 1024px) 260px, (min-width: 768px) 220px, 224px"
                className="object-cover object-[center_35%]"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">
                Created By
              </p>
              <h2 className="mt-3 text-3xl font-bold text-black sm:text-4xl">Satya</h2>
              <p className="mt-1 text-1xl font-bold text-black sm:text-1xl">Web Developer</p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">
                This project is a food delivery app built to make ordering, checkout, and delivery tracking simple on both desktop and mobile.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-orange-50 px-4 py-4">
                  <p className="text-sm font-semibold text-black">Project</p>
                  <p className="mt-1 text-sm text-gray-600">Delivery App</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-4 py-4">
                  <p className="text-sm font-semibold text-black">Built With</p>
                  <p className="mt-1 text-sm text-gray-600">Next.js, React, Supabase</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-4 py-4">
                  <p className="text-sm font-semibold text-black">Features</p>
                  <p className="mt-1 text-sm text-gray-600">Cart, orders, live tracking</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-4 py-4">
                  <p className="text-sm font-semibold text-black">Purpose</p>
                  <p className="mt-1 text-sm text-gray-600">College Project</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
