import { useState, useCallback, useEffect } from 'react'
import { TOPICS, CATEGORY_LABELS, type KnowledgeTopic, type TopicCategory } from '../knowledge'

interface MentorModalProps {
  onClose: () => void
}

const CATEGORIES: TopicCategory[] = ['basico', 'intermedio', 'avanzado']
const CATEGORY_ICONS: Record<TopicCategory, string> = {
  basico: '📘',
  intermedio: '📗',
  avanzado: '📕'
}

export function MentorModal({ onClose }: MentorModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<KnowledgeTopic>(TOPICS[0])

  const topicsByCategory = CATEGORIES.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    icon: CATEGORY_ICONS[cat],
    topics: TOPICS.filter(t => t.category === cat)
  }))

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleRelatedClick(id: string) {
    const topic = TOPICS.find(t => t.id === id)
    if (topic) setSelectedTopic(topic)
  }

  return (
    <div className="mentor-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={e => e.stopPropagation()}>
        <div className="mentor-header">
          <h2 className="mentor-title">📘 Mentor Markdown</h2>
          <button className="mentor-close" onClick={onClose}>✕</button>
        </div>
        <div className="mentor-body">
          <aside className="mentor-sidebar">
            {topicsByCategory.map(group => (
              <div key={group.category} className="mentor-category">
                <div className="mentor-category-title">
                  {group.icon} {group.label}
                </div>
                {group.topics.map(topic => (
                  <button
                    key={topic.id}
                    className={`mentor-topic-btn ${selectedTopic.id === topic.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            ))}
          </aside>
          <main className="mentor-content">
            <h3 className="mentor-topic-title">{selectedTopic.title}</h3>
            <p className="mentor-summary">{selectedTopic.summary}</p>

            <section className="mentor-section">
              <h4 className="mentor-section-title">Sintaxis</h4>
              <div className="mentor-syntax-list">
                {selectedTopic.syntax.map((s, i) => (
                  <code key={i} className="mentor-syntax-item">{s}</code>
                ))}
              </div>
            </section>

            <section className="mentor-section">
              <h4 className="mentor-section-title">Explicación</h4>
              <p className="mentor-details">{selectedTopic.details}</p>
            </section>

            <section className="mentor-section">
              <h4 className="mentor-section-title">Ejemplo</h4>
              <div className="mentor-example">
                <pre className="mentor-example-input"><code>{selectedTopic.example.input}</code></pre>
                <p className="mentor-example-rendered">{selectedTopic.example.rendered}</p>
              </div>
            </section>

            {selectedTopic.tips.length > 0 && (
              <section className="mentor-section">
                <h4 className="mentor-section-title">💡 Tips</h4>
                <ul className="mentor-tips">
                  {selectedTopic.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedTopic.related.length > 0 && (
              <section className="mentor-section">
                <h4 className="mentor-section-title">Temas relacionados</h4>
                <div className="mentor-related">
                  {selectedTopic.related.map(id => {
                    const t = TOPICS.find(t => t.id === id)
                    if (!t) return null
                    return (
                      <button
                        key={id}
                        className="mentor-related-btn"
                        onClick={() => handleRelatedClick(id)}
                      >
                        {t.title} →
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
