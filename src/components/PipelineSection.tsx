import { useTranslations } from 'next-intl'

const SOURCES = [
  { name: 'Backyard Ultra Podcast', sub: 'youtube_channel · EN', channelId: 'UCvhc5JNbqjVFFlRnMJIgEpA' },
  { name: 'Nikolay Kotenkov',       sub: 'youtube_channel · RU', channelId: 'NIKOLAY_KOTENKOV' },
  { name: 'Kirill Tsvetkov',        sub: 'youtube_channel · RU', channelId: 'kirill_tsvet_kov' },
  { name: 'Rich Roll',              sub: 'youtube_channel · EN', channelId: 'UCSfszHqMScXnpNZU17NLEUQ' },
  { name: 'Diary of a CEO',         sub: 'youtube_channel · EN', channelId: 'UCGq-a57w-aPwyi3pW7XLiHw' },
]

export default function PipelineSection() {
  const t = useTranslations('pipeline')
  const steps = [
    { n: '01', title: t('step1_title'), desc: t('step1_desc') },
    { n: '02', title: t('step2_title'), desc: t('step2_desc') },
    { n: '03', title: t('step3_title'), desc: t('step3_desc') },
    { n: '04', title: t('step4_title'), desc: t('step4_desc') },
  ]

  return (
    <section className="py-24 px-14 bg-forest2" id="pipeline">
      <div className="eyebrow">{t('title_1').split('?')[0]}</div>
      <div className="grid grid-cols-2 gap-20 items-start">
        <div>
          <h2 className="font-display text-[clamp(30px,3.2vw,48px)] uppercase leading-[0.95] text-white mb-4">
            {t('title_1')}<br />{t('title_2')}<br />{t('title_3')}
          </h2>
          <p className="text-[13px] leading-[1.85] text-dawn/55 font-light mb-7">{t('desc')}</p>
          <div className="space-y-[10px]">
            {SOURCES.map(src => (
              <div key={src.name} className="flex items-center gap-[14px] px-[18px] py-[14px] bg-white/4 border-l-[3px] border-ember">
                <div className="text-[18px] text-ember w-[22px] text-center">▶</div>
                <div>
                  <div className="font-display text-[15px] text-white">{src.name}</div>
                  <div className="font-mono text-[10px] text-dawn/40 mt-[2px]">{src.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.n} className={`flex gap-4 py-[18px] ${i < steps.length - 1 ? 'border-b border-white/6' : ''}`}>
              <div className="font-display text-[44px] leading-none text-ember/20 min-w-[38px]">{step.n}</div>
              <div>
                <div className="font-display text-[16px] uppercase tracking-[0.06em] text-white mb-1">{step.title}</div>
                <div className="text-[11px] leading-[1.65] text-dawn/45">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
