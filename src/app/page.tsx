import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-cmu-red to-cmu-black text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-white rounded-full" />
            Carnegie Mellon University
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Undergraduate Research<br />Opportunities Portal
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto mb-10">
            Connecting CMU undergraduates with faculty research opportunities across every department and discipline.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/opportunities"
              className="bg-white text-cmu-red font-bold px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors text-lg"
            >
              Browse opportunities
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            A straightforward platform for faculty to share opportunities and students to find meaningful research experience.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">For Students</h3>
              <p className="text-gray-500 mb-6">Find research positions that match your interests and schedule.</p>
              <ol className="space-y-4">
                {[
                  ["Register", "Create a free student account with your CMU email"],
                  ["Browse & filter", "Search opportunities by department, pay, format, and experience level"],
                  ["Apply", "Submit a cover letter and optional resume directly through the portal"],
                  ["Track", "Follow the status of all your applications in one place"],
                ].map(([title, desc], i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-7 h-7 bg-cmu-red text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href="/login" className="mt-8 inline-block bg-cmu-red text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors">
                Register as student →
              </Link>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">For Faculty</h3>
              <p className="text-gray-500 mb-6">Reach motivated undergraduates across the entire university.</p>
              <ol className="space-y-4">
                {[
                  ["Register", "Create a faculty account with your department and contact info"],
                  ["Post opportunity", "Describe your project, compensation, schedule, and requirements"],
                  ["Review applicants", "View cover letters and resumes from interested students"],
                  ["Accept & connect", "Update application statuses and reach out directly by email"],
                ].map(([title, desc], i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-7 h-7 bg-cmu-red text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href="/login" className="mt-8 inline-block bg-cmu-red text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors">
                Register as faculty →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Filter by what matters to you</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "💰", title: "Compensation", desc: "Hourly pay, stipend, course credit, or volunteer" },
              { icon: "📍", title: "Work format", desc: "In-person on campus, fully remote, or hybrid" },
              { icon: "📚", title: "Department", desc: "All 20+ CMU departments and schools" },
              { icon: "⭐", title: "Experience", desc: "From no experience required to advanced" },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-cmu-red text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-red-100 text-lg mb-8">Join the CMU Research Portal today.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/opportunities" className="bg-white text-cmu-red font-bold px-8 py-3 rounded-xl hover:bg-red-50 transition-colors">
              Browse openings
            </Link>
            <Link href="/login" className="border-2 border-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
