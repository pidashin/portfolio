import Link from 'next/link';
import Image from 'next/image';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';

export default function HomePage() {
  return (
    <main className="bg-orange-50 text-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-5 shadow-lg shadow-orange-100/70">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Headshot */}
          <div className="flex-shrink-0">
            <Image
              src="/headshot.png"
              alt="Profile Headshot"
              width={180} // Increased size
              height={180}
              className="rounded-full shadow-lg"
            />
          </div>

          {/* Profile Info */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">Johnny Yeh</h1>
            <h2 className="text-2xl mb-4">Front-end Engineer</h2>
            <p className="text-lg mb-6">
              Front-end engineer with 12+ years of experience crafting
              high-performance React applications, architecting scalable Redux
              state management, and building robust SaaS platforms that drive
              business success.
            </p>

            {/* Social Media Icons */}
            <div className="flex justify-center md:justify-start gap-6">
              <a
                href="https://www.linkedin.com/in/kai-chen-yeh-9687b869"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                <FaLinkedin size={30} />
              </a>
              <a
                href="https://github.com/pidashin?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                <FaGithub size={30} />
              </a>
              <a
                href="mailto:bestlove_charlene@hotmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                <FaEnvelope size={30} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-5 shadow-lg shadow-orange-100/70">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About Me</h2>
          <p className="text-lg mb-6 text-left">
            I’m a passionate web developer with extensive front-end expertise,
            specializing in React, Redux, and SaaS development. With years of
            experience leading teams, delivering scalable projects, and
            mentoring developers, I thrive in creating innovative solutions.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="bg-white p-4 rounded shadow">
              <strong>Top Skills:</strong> React.js, Redux.js, NextJs, Storybook
            </li>
            <li className="bg-white p-4 rounded shadow">
              <strong>Languages:</strong> English (Professional), Chinese
              (Native)
            </li>
          </ul>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Working Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sportsbook Platform Project */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-bold mb-4">Sportsbook Platform</h3>
              <Image
                src="/188bet.png"
                alt="sportsbook platform screenshot"
                width={300}
                height={138}
                className="mx-auto shadow-lg"
              />
              <p className="text-gray-700 mb-4 mt-4 text-left">
                From 2014 to 2021, I worked on multiple sportsbook platforms,
                including 188bet.com. These platforms provided a seamless online
                sports betting experience, allowing users to browse events,
                place bets, and track results efficiently.
              </p>
              <ul className="text-gray-700 mb-4 text-left list-disc pl-5">
                <li>
                  <strong>Landing Page:</strong> Displays featured games and
                  sports categories for easy navigation.
                </li>
                <li>
                  <strong>Game Page:</strong> Provides betting markets for
                  specific events.
                </li>
                <li>
                  <strong>Betslip:</strong> Allows single and combo bets with an
                  intuitive interface.
                </li>
                <li>
                  <strong>Statement Page:</strong> Summarizes bet history,
                  winnings, and losses.
                </li>
              </ul>
              <Link href="/projects/sportsbook">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Learn More
                </button>
              </Link>
            </div>
            {/* Project Card 2 */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-bold mb-4">3D Floor Plan</h3>
              <Image
                src="/floorplan.png" // Add your image to the public folder as "headshot.jpg"
                alt="3d floor plan"
                width={300}
                height={138}
                className="mx-auto shadow-lg"
              />
              <p className="text-gray-700 mb-4 mt-4">
                A brief description of the project.
              </p>
              <Link href="/projects/project2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
