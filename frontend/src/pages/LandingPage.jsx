import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, KeyRound, MapPin, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const homes = [
  { name: 'The Courtyard House', area: 'Ikoyi, Lagos', price: 8500000, beds: 4, baths: 3, type: 'House', image: 'photo-1600210492486-724fe5c67fb0', tag: 'JUST LISTED' },
  { name: 'Palmline Residence', area: 'Victoria Island, Lagos', price: 6200000, beds: 3, baths: 3, type: 'Apartment', image: 'photo-1600607687939-ce8a6c25118c', tag: 'GREAT VALUE' },
  { name: 'The Canopy', area: 'Maitama, Abuja', price: 4800000, beds: 3, baths: 2, type: 'Apartment', image: 'photo-1600566753086-00f18fb6b3ea', tag: 'MOVE-IN READY' },
];

const photo = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const naira = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount)}`;

export default function LandingPage() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('Any type');
  const [maxRent, setMaxRent] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  const visibleHomes = useMemo(() => homes.filter((home) => {
    const matchesArea = !location || home.area.toLowerCase().includes(location.toLowerCase());
    const matchesType = propertyType === 'Any type' || home.type === propertyType;
    const matchesRent = !maxRent || home.price <= Number(maxRent);
    return matchesArea && matchesType && matchesRent;
  }), [location, propertyType, maxRent]);

  function handleSearch(event) {
    event.preventDefault();
    setSearchMessage(`${visibleHomes.length} thoughtfully chosen ${visibleHomes.length === 1 ? 'home' : 'homes'} match your search`);
    document.getElementById('homes')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="landing-page">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Keyhouse home"><span className="brand-mark">k.</span><span>keyhouse</span></Link>
        <button className="icon-button landing-menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={21} />
        </button>
        <nav className={`site-nav${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a href="#homes" onClick={() => setMobileMenuOpen(false)}>Find a home</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>For property managers</Link>
          <Link className="nav-cta" to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Your workspace <ArrowUpRight size={15} /></Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span className="eyebrow-rule" /> BETTER RENTING STARTS HERE</div>
            <h1>A place that<br />feels like <em>yours.</em></h1>
            <p className="hero-description">Find a home that fits the life you’re building. Manage your rental, with a little more peace of mind.</p>
            <a className="hero-link" href="#homes">Explore homes <ArrowDown size={16} /></a>
            <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>T</span><span>M</span><span>+</span></div><p><strong>Good homes, good people.</strong><br />A better way to rent in Nigeria.</p></div>
          </div>
          <div className="hero-visual">
            <img className="hero-image" src={photo('photo-1600607687920-4e2a09cf159d', 1500)} alt="Sunlit contemporary home opening onto a leafy courtyard" />
            <div className="hero-image-shade" />
            <div className="hero-image-note"><span className="note-pin"><MapPin size={15} /></span><span><strong>A slower kind of city life</strong><small>Ikoyi · Lagos</small></span><ArrowUpRight size={16} /></div>
            <div className="hero-image-index"><span>01</span><i /><span>03</span></div>
            <div className="image-edge-note">SPACES TO SETTLE INTO</div>
          </div>
          <form className="property-search" onSubmit={handleSearch}>
            <label className="search-field search-location"><span className="field-icon"><MapPin size={17} /></span><span className="field-copy"><span>NEIGHBOURHOOD</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Where in Nigeria?" /></span></label>
            <label className="search-field"><span className="field-copy"><span>PROPERTY TYPE</span><select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}><option>Any type</option><option>Apartment</option><option>House</option></select></span><ChevronDown size={15} /></label>
            <label className="search-field"><span className="field-copy"><span>MONTHLY BUDGET</span><select value={maxRent} onChange={(event) => setMaxRent(event.target.value)}><option value="">Any budget</option><option value="3000000">Up to ₦3m</option><option value="5000000">Up to ₦5m</option><option value="7000000">Up to ₦7m</option><option value="10000000">Up to ₦10m</option></select></span><ChevronDown size={15} /></label>
            <button className="search-submit" type="submit"><Search size={17} /><span>Find a home</span></button>
          </form>
        </section>

        <section className="featured-section section-wrap" id="homes">
          <div className="section-heading">
            <div><p className="eyebrow">A FEW PLACES TO START</p><h2>Homes with a little <em>more heart.</em></h2></div>
            <a className="section-link" href="#homes">Browse all homes <ArrowRight size={16} /></a>
          </div>
          {searchMessage && <p className="search-result-message" role="status">{searchMessage}</p>}
          <div className="property-grid">
            {visibleHomes.length ? visibleHomes.map((home, index) => (
              <article className="property-card" key={home.name}>
                <a href="#homes" className="property-photo" aria-label={`View ${home.name}`}>
                  <img src={photo(home.image)} alt={`${home.type} in ${home.area}`} loading="lazy" />
                  <span className="property-tag">{home.tag}</span>
                  <span className="property-photo-index">0{index + 1} / 03</span>
                </a>
                <div className="property-info"><div className="property-title-row"><h3>{home.name}</h3><span className="property-type">{home.type}</span></div>
                  <p className="property-location"><MapPin size={14} />{home.area}</p>
                  <div className="property-meta"><span>{home.beds} bedrooms</span><i /><span>{home.baths} bathrooms</span><strong>{naira(home.price)}<small> / year</small></strong></div>
                </div>
              </article>
            )) : <div className="no-homes"><Compass size={22} /><p>No homes match those filters just yet.</p><button type="button" onClick={() => { setLocation(''); setPropertyType('Any type'); setMaxRent(''); setSearchMessage(''); }}>Clear search</button></div>}
          </div>
        </section>

        <section className="manifesto-section" id="how-it-works">
          <div className="manifesto-inner">
            <div className="manifesto-heading"><p className="eyebrow"><span className="eyebrow-rule" /> LESS HASSLE, MORE HOME</p><h2>Renting should feel<br />like <em>moving forward.</em></h2></div>
            <div className="manifesto-aside"><p>From the first viewing to the everyday details, the right tools make all the difference. We bring renters and property managers onto the same page.</p><a href="#features" className="manifesto-link">What makes Keyhouse different <ArrowRight size={16} /></a></div>
            <div className="manifesto-image"><img src={photo('photo-1600607687939-ce8a6c25118c', 1200)} alt="Warm, carefully designed living room in a Nigerian home" loading="lazy" /><span>01 — MAKE YOURSELF AT HOME</span></div>
          </div>
        </section>

        <section className="feature-section section-wrap" id="features">
          <div className="feature-intro"><p className="eyebrow">A BETTER WAY TO RENT</p><h2>Thoughtful by<br />design.</h2><p>One calm place for the important things, whether you’re finding a home or looking after one.</p><Link to="/dashboard" className="feature-cta">For property managers <ArrowUpRight size={16} /></Link></div>
          <div className="feature-list">
            <article className="feature-item"><span className="feature-icon feature-icon-green"><KeyRound size={20} /></span><div><h3>Find the right fit</h3><p>Explore considered listings across Lagos, Abuja and beyond, with the details that matter up front.</p></div><span className="feature-number">01</span></article>
            <article className="feature-item"><span className="feature-icon feature-icon-orange"><ShieldCheck size={20} /></span><div><h3>Know where you stand</h3><p>Applications, agreements and payments stay clear, organised and easy to come back to.</p></div><span className="feature-number">02</span></article>
            <article className="feature-item"><span className="feature-icon feature-icon-blue"><Sparkles size={20} /></span><div><h3>Feel at home, sooner</h3><p>Keep the little things moving, from a maintenance request to your next rent payment.</p></div><span className="feature-number">03</span></article>
          </div>
        </section>

        <section className="quote-section"><div className="quote-mark">“</div><blockquote>Finding a home shouldn’t feel like a second job. Keyhouse made the whole thing feel surprisingly human.</blockquote><div className="quote-byline"><span className="quote-avatar">A</span><span><strong>One happy renter</strong><small>Lagos, Nigeria</small></span><span className="quote-stars">★★★★★</span></div></section>

        <section className="closing-section"><div className="closing-image"><img src={photo('photo-1600210492486-724fe5c67fb0', 1400)} alt="A bright, welcoming home ready for its next chapter" loading="lazy" /></div><div className="closing-copy"><p className="eyebrow">YOUR NEXT CHAPTER, STARTS HERE</p><h2>There’s a place<br />for <em>what’s next.</em></h2><p>Come find a home you’re excited to come back to.</p><a className="closing-button" href="#homes">Find your place <ArrowRight size={17} /></a></div></section>
      </main>

      <footer className="site-footer"><Link to="/" className="brand"><span className="brand-mark">k.</span><span>keyhouse</span></Link><span>Renting, with more room to breathe.</span><div><a href="#homes">Find a home</a><Link to="/dashboard">Property managers</Link><span>© 2026 Keyhouse</span></div></footer>
    </div>
  );
}
