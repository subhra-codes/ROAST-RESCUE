import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Github, ArrowRight, LockKeyhole, Search, RefreshCw, Dna } from 'lucide-react';
import * as THREE from 'three';
import Page2Analysis from './components/Page2Analysis';
import RecruiterLens from './components/RecruiterLens';
import DeveloperDNA from './components/DeveloperDNA';
import RoastSection from './components/RoastSection';
import RepositorySurgery from './components/RepositorySurgery';
import RescueSimulator from './components/RescueSimulator';
import DNACompare from './components/DNACompare';
import InterviewTest from './components/InterviewTest';

const GREEN = new THREE.Color('#7CFF6B');
const WHITE = new THREE.Color('#E8EEE7');

function HelixVisual() {
  const group = useRef(null);
  const count = 260;
  const pointsA = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const a = t * Math.PI * 7.5;
      const y = 5.9 - t * 11.8;
      const r = 1.55 + Math.sin(t * Math.PI * 4) * 0.08;
      arr.push([r * Math.cos(a), y, r * Math.sin(a)]);
    }
    return arr;
  }, []);

  const pointsB = useMemo(
    () => pointsA.map(([x, y, z]) => [-x, y, -z]),
    [pointsA]
  );

  const bondLines = useMemo(() => {
    const bonds = [];
    for (let i = 0; i < count; i += 10) {
      bonds.push([pointsA[i], pointsB[i]]);
    }
    return bonds;
  }, [pointsA, pointsB]);

  const particleCloud = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 110; i++) {
      const t = (i * 0.618) % 1;
      const a = t * Math.PI * 12 + (i % 7) * 0.3;
      const r = 2.0 + (i % 9) * 0.18;
      const y = 5.7 - t * 11.4 + Math.sin(i * 1.7) * 0.45;
      arr.push([
        r * Math.cos(a),
        y,
        r * Math.sin(a),
        0.025 + (i % 4) * 0.018
      ]);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.075;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <group ref={group} rotation={[0.05, -0.35, -0.04]}>
      <pointLight position={[0, 0, 2]} color="#7CFF6B" intensity={5} distance={8} />

      {[pointsA, pointsB].map((strand, strandIndex) => {
        const positions = new Float32Array(strand.flat());
        return (
          <group key={strandIndex}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={positions.length / 3}
                  array={positions}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={strandIndex === 0 ? '#7CFF6B' : '#DCE4DC'}
                transparent
                opacity={0.7}
              />
            </line>

            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={positions.length / 3}
                  array={positions}
                  itemSize={3}
                />
              </bufferGeometry>
              <pointsMaterial
                color={strandIndex === 0 ? '#8CFF7D' : '#EEF2EC'}
                size={0.075}
                sizeAttenuation
                transparent
                opacity={0.9}
              />
            </points>
          </group>
        );
      })}

      {bondLines.map(([a, b], index) => {
        const start = new THREE.Vector3(...a);
        const end = new THREE.Vector3(...b);
        const direction = end.clone().sub(start);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const length = direction.length();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.normalize()
        );

        return (
          <mesh key={index} position={midpoint} quaternion={quaternion}>
            <cylinderGeometry args={[0.018, 0.018, length, 6]} />
            <meshBasicMaterial color="#AAB5AB" transparent opacity={0.42} />
          </mesh>
        );
      })}

      {particleCloud.map(([x, y, z, size], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[size, 6, 6]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? GREEN : WHITE}
            transparent
            opacity={0.42 + (index % 5) * 0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

function DNAStage() {
  return (
    <div className="dna-stage" aria-hidden="true">
      <div className="dna-haze haze-one" />
      <div className="dna-haze haze-two" />

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 17], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.35} />
        <HelixVisual />
      </Canvas>

      <div className="dna-fade" />

      <div className="signal signal-activity"><i />&lt; ACTIVITY /&gt;</div>
      <div className="signal signal-projects"><i />&lt; PROJECTS /&gt;</div>
      <div className="signal signal-docs"><i />&lt; DOCUMENTATION /&gt;</div>
      <div className="signal signal-tech"><i />&lt; TECHNOLOGIES /&gt;</div>
      <div className="signal signal-contributions"><i />&lt; CONTRIBUTIONS /&gt;</div>
      <div className="signal signal-impact"><i />&lt; IMPACT /&gt;</div>

      <div className="github-orb orb-one"><Github /></div>
      <div className="github-orb orb-two"><Github /></div>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState('');
  const [screen, setScreen] = useState('landing');
  const [analysisData, setAnalysisData] = useState(null);
  const [activeReportSection, setActiveReportSection] = useState('recruiter-lens');

  useEffect(() => {
    if (screen !== 'report') return undefined;

    const sectionIds = ['recruiter-lens', 'developer-dna', 'roast', 'repository-surgery', 'rescue-simulator', 'dna-compare', 'interview-test'];

    const updateActiveSection = () => {
      const marker = window.scrollY + 120;
      let current = sectionIds[0];
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) current = id;
      });
      setActiveReportSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [screen]);

  const analyze = (event) => {
    event?.preventDefault();
    const clean = username
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/$/, '')
      .split('/')[0];

    if (!clean) return;
    setUsername(clean);
    setScreen('analysis');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      setActiveReportSection(id);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (screen === 'analysis') {
    return (
      <Page2Analysis
        username={username}
        onComplete={(fetchedData) => {
          setAnalysisData(fetchedData);
          setActiveReportSection('recruiter-lens');
          setScreen('report');
        }}
        onInvalid={() => {
          setAnalysisData(null);
          setUsername('');
          setScreen('landing');
        }}
      />
    );
  }

  if (screen === 'report') {
    const userObj = analysisData?.user || { login: username, avatar_url: '' };
    const recruiterData = analysisData?.recruiterLens;
    const dnaData = analysisData?.dna;
    const roastsData = analysisData?.roasts;
    const surgeryData = analysisData?.repoSurgery;
    const rescueData = analysisData?.rescue;
    const interviewData = analysisData?.interview;

    return (
      <div className="report-container">
        {/* Sticky Report Topbar */}
        <header className="report-sticky-topbar">
          <div className="brand" onClick={() => setScreen('landing')} style={{ cursor: 'pointer' }}>
            <span className="rr">R<span>/</span>R</span>
            <span className="header-divider" />
            <span className="brand-name">CAREER INTELLIGENCE REPORT</span>
          </div>

          <nav className="report-nav-tabs">
            <button className={activeReportSection === 'recruiter-lens' ? 'active' : ''} onClick={() => scrollToSection('recruiter-lens')}>01 LENS</button>
            <button className={activeReportSection === 'developer-dna' ? 'active' : ''} onClick={() => scrollToSection('developer-dna')}>02 DNA</button>
            <button className={activeReportSection === 'roast' ? 'active' : ''} onClick={() => scrollToSection('roast')}>03 ROAST</button>
            <button className={activeReportSection === 'repository-surgery' ? 'active' : ''} onClick={() => scrollToSection('repository-surgery')}>04 SURGERY</button>
            <button className={activeReportSection === 'rescue-simulator' ? 'active' : ''} onClick={() => scrollToSection('rescue-simulator')}>05 RESCUE</button>
            <button className={activeReportSection === 'dna-compare' ? 'active' : ''} onClick={() => scrollToSection('dna-compare')}>06 COMPARE</button>
            <button className={activeReportSection === 'interview-test' ? 'active' : ''} onClick={() => scrollToSection('interview-test')}>07 INTERVIEW</button>
          </nav>

          <div className="report-header-actions">
            <button className="new-search-btn" onClick={() => setScreen('landing')}>
              <RefreshCw size={14} /> NEW SEARCH
            </button>
          </div>
        </header>

        {/* User Summary Header Banner */}
        <div className="user-profile-bar">
          <div className="profile-info-wrap">
            {userObj.avatar_url && <img src={userObj.avatar_url} alt={userObj.login} className="user-avatar" />}
            <div>
              <h1 className="user-title">@{userObj.login}</h1>
              <p className="user-bio">{userObj.bio || 'Public GitHub Developer Profile'}</p>
            </div>
          </div>

          <div className="profile-stats-pills">
            <div className="pill"><span className="lbl">REPOS</span> <span className="val">{userObj.public_repos || 0}</span></div>
            <div className="pill"><span className="lbl">FOLLOWERS</span> <span className="val">{userObj.followers || 0}</span></div>
            <div className="pill green"><span className="lbl">ARCHETYPE</span> <span className="val">{dnaData?.archetype || 'DEVELOPER'}</span></div>
          </div>
        </div>

        {/* Page 3: Recruiter Lens */}
        <RecruiterLens data={recruiterData} user={userObj} />

        {/* Page 4: Developer DNA */}
        <DeveloperDNA dna={dnaData} user={userObj} />

        {/* Page 5: Evidence-Based Roast */}
        <RoastSection roasts={roastsData} user={userObj} />

        {/* Page 6: Repository Surgery */}
        <RepositorySurgery repoSurgery={surgeryData} user={userObj} />

        {/* Page 7: Rescue Simulator */}
        <RescueSimulator rescue={rescueData} user={userObj} />

        {/* Page 8: DNA Compare */}
        <DNACompare
          currentUser={userObj.login}
          currentScores={dnaData?.dnaScores}
          currentArchetype={dnaData?.archetype}
        />

        {/* Page 9: Interview Pressure Test */}
        <InterviewTest interviewData={interviewData} user={userObj} />

        <footer className="report-footer">
          <div className="rr-brand-foot">
            <span className="rr">R<span>/</span>R</span>
            <span>ROAST / RESCUE — GITHUB CAREER INTELLIGENCE</span>
          </div>
          <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            BACK TO TOP ↑
          </button>
        </footer>
      </div>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="rr">R<span>/</span>R</span>
          <span className="header-divider" />
          <span className="brand-name">GITHUB CAREER INTELLIGENCE</span>
        </div>

        <nav>
          <a href="#how" onClick={(e) => { e.preventDefault(); setUsername('octocat'); setScreen('analysis'); }}>DEMO PROFILE</a>
          <span className="header-divider" />
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github size={24} strokeWidth={1.8} />
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>GITHUB CAREER INTELLIGENCE</span>
            <b />
          </div>

          <h1>
            YOUR GITHUB.<br />
            THEIR <em>FIRST IMPRESSION.</em>
          </h1>

          <p className="subcopy">
            See your GitHub the way a recruiter sees it.<br />
            Discover your strengths. Expose weak signals.<br />
            Get a data-driven path to improve your profile.
          </p>

          <form className="analyze-form" onSubmit={analyze}>
            <Github size={22} strokeWidth={1.8} />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="github.com/your-username"
              aria-label="GitHub username or profile URL"
              autoComplete="off"
              spellCheck="false"
            />
            <button type="submit" aria-label="Analyze GitHub">
              <ArrowRight size={28} strokeWidth={1.8} />
            </button>
          </form>

          <div className="privacy">
            <LockKeyhole size={14} />
            <span>PUBLIC GITHUB DATA ONLY · NO LOGIN REQUIRED.</span>
          </div>
        </div>

        <DNAStage />
      </section>

      <footer className="bottom-nav">
        <span>RECRUITER LENS</span>
        <b>•</b>
        <span>DEVELOPER DNA</span>
        <b>•</b>
        <span>ROAST</span>
        <b>•</b>
        <span>RESCUE</span>
        <b>•</b>
        <span>INTERVIEW TEST</span>
      </footer>

      <div className="scroll-cue">
        <span className="mouse"><i /></span>
        <span>SCROLL<br />TO EXPLORE</span>
      </div>
    </main>
  );
}
