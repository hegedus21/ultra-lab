import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function RolunkPage() {
  return (
    <>
      <Nav />
      <div style={{ background: 'var(--forest)', paddingTop: 120, paddingBottom: 64, paddingLeft: 56, paddingRight: 56 }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 'clamp(48px,6vw,80px)',
          textTransform: 'uppercase', color: '#fff', margin: 0,
        }}>
          Rólunk
        </h1>
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '64px 56px' }}>
        <p style={{ fontSize: 16, lineHeight: 1.85, marginBottom: 24 }}>
          Az Ultra Lab egy ultrafutás tudástár, amelyet Backyard Ultra és trail ultra futók számára hoztunk létre.
          Célunk, hogy a világ legjobb ultrafutóinak tapasztalatait, stratégiáit és módszereit magyarul elérhetővé tegyük.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.85, marginBottom: 24 }}>
          A cikkek YouTube interjúkból és podcastokból készülnek — részben mesterséges intelligencia segítségével,
          részben szerkesztői munkával. Az AI szekció automatikusan generált tartalmakat tartalmaz,
          míg a Tudástár szerkesztett, validált cikkeket.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.85 }}>
          Figyelt csatornák: Backyard Ultra Podcast, Nikolay Kotenkov, Kirill Tsvetkov, Rich Roll, Diary of a CEO.
        </p>
      </div>
      <Footer />
    </>
  )
}