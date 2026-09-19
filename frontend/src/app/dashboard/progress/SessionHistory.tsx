"use client";

import React, { useState } from 'react';
import { ActivityCalendar, Activity, ThemeInput } from 'react-activity-calendar';

type SessionInfo = {
  id: string;
  activity_name: string;
  response: string;
  text_note: string | null;
  voice_note_url: string | null;
  time: string;
};

type TherapySessionInfo = {
  id: string;
  therapist_name: string;
  time: string;
  mode: string;
  therapist_notes: string | null;
  ai_summary: string | null;
  recording_url: string | null;
  audio_url: string | null;
  audio_transcript: string | null;
};

type HistoryData = {
  date: string;
  sessions: SessionInfo[];
  therapy_sessions?: TherapySessionInfo[];
  total_completed: number;
  independent_count: number;
};

interface Props {
  history: HistoryData[];
}

export default function SessionHistory({ history }: Props) {
  const [selectedDate, setSelectedDate] = useState<HistoryData | null>(null);

  // Map dates to history data for quick lookup
  const historyMap = new Map(history.map(h => [h.date, h]));

  // Generate the last 180 days for the calendar
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarData: Activity[] = [];
  for (let i = 179; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const data = historyMap.get(dateStr);
    const count = data ? data.total_completed : 0;
    
    // Calculate level (0-4) based on count
    let level = 0;
    if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count === 3) level = 3;
    else if (count >= 4) level = 4;

    calendarData.push({
      date: dateStr,
      count: count,
      level: level as 0 | 1 | 2 | 3 | 4
    });
  }

  const handleDayClick = (activity: Activity) => {
    const dateStr = activity.date;
    const data = historyMap.get(dateStr);
    if (data) {
      setSelectedDate(data);
    } else {
      setSelectedDate({
        date: dateStr,
        sessions: [],
        therapy_sessions: [],
        total_completed: 0,
        independent_count: 0
      });
    }
  };

  const theme: ThemeInput = {
    light: ['rgba(255, 255, 255, 0.05)', '#86efac', '#4ade80', '#22c55e', '#166534'],
    dark: ['rgba(255, 255, 255, 0.05)', '#86efac', '#4ade80', '#22c55e', '#166534'],
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <p style={{ color: '#a1a1aa', margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
        Practice history over the last 6 months. Click a day to see details.
      </p>

      {/* Real Calendar Heatmap */}
      <div style={{ marginBottom: '2rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        <ActivityCalendar 
          data={calendarData} 
          theme={theme}
          colorScheme="dark"
          labels={{
            legend: {
              less: 'Less',
              more: 'More',
            },
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            totalCount: '{{count}} sessions in the last 6 months',
          }}
          renderBlock={(block, activity) => (
            React.cloneElement(block, {
              onClick: () => handleDayClick(activity)
            })
          )}
          blockMargin={4}
          blockRadius={2}
          blockSize={12}
          showTotalCount={true}
          showWeekdayLabels={true}
        />
      </div>

      {/* Day Details Panel */}
      {selectedDate && (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>
            {new Date(selectedDate.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </h3>
          
          {selectedDate.sessions.length === 0 && (!selectedDate.therapy_sessions || selectedDate.therapy_sessions.length === 0) ? (
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.875rem' }}>No sessions recorded on this day. That's okay! We don't track streaks here.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              
              {/* Therapy Sessions */}
              {selectedDate.therapy_sessions?.map(ts => (
                <div key={ts.id} style={{ padding: '1rem', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>🩺</span>
                      <span style={{ fontWeight: '700', color: '#38bdf8' }}>Therapy Session with {ts.therapist_name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{ts.time}</span>
                  </div>
                  
                  {ts.ai_summary && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>AI Session Insights</span>
                      <p style={{ fontSize: '0.875rem', color: '#e2e8f0', margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>{ts.ai_summary}</p>
                    </div>
                  )}

                  {ts.therapist_notes && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase' }}>Therapist Notes</span>
                      <p style={{ fontSize: '0.875rem', color: '#e2e8f0', margin: '0.25rem 0', fontStyle: 'italic', background: 'rgba(74, 222, 128, 0.05)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                        "{ts.therapist_notes}"
                      </p>
                    </div>
                  )}

                  {ts.audio_url && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Audio Summary</span>
                      <audio controls src={ts.audio_url} style={{ height: '36px', width: '100%', marginTop: '0.25rem' }} />
                      {ts.audio_transcript && (
                        <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.5rem 0 0', fontStyle: 'italic' }}>Transcript: "{ts.audio_transcript}"</p>
                      )}
                    </div>
                  )}

                  {ts.recording_url && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <a href={ts.recording_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                        ▶ Watch Session Recording
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {/* Regular Activities */}
              {selectedDate.sessions.map(session => (
                <div key={session.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>{session.activity_name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{session.time}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '1rem', 
                      backgroundColor: session.response.toLowerCase() === 'independent' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                      color: session.response.toLowerCase() === 'independent' ? '#4ade80' : '#facc15'
                    }}>
                      {session.response}
                    </span>
                  </div>

                  {session.text_note && (
                    <p style={{ fontSize: '0.875rem', color: '#e2e8f0', margin: '0.5rem 0', fontStyle: 'italic' }}>
                      "{session.text_note}"
                    </p>
                  )}

                  {session.voice_note_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <audio controls src={session.voice_note_url} style={{ height: '30px', width: '100%', maxWidth: '300px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
