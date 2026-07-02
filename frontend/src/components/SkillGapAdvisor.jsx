import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ExternalLink, BookOpen, AlertCircle, PlayCircle, Award } from 'lucide-react';

const SkillGapAdvisor = ({ resumeId, jobDescription }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resumeId || !jobDescription) return;
    
    const fetchRecommendations = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/api/premium/skill-gap-advisor', {
          resumeId,
          jobDescription
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to analyze skill gaps.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [resumeId, jobDescription]);

  const getPlatformIcon = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('youtube')) return <PlayCircle className="w-4 h-4 text-red-500" />;
    if (p.includes('coursera') || p.includes('udemy') || p.includes('pluralsight')) return <Award className="w-4 h-4 text-violet-500" />;
    return <BookOpen className="w-4 h-4 text-emerald-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="spinner"></div>
        <p className="text-sm font-semibold text-themed-secondary">
          Analyzing JD and matching learning resources...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-500/10 rounded-xl border border-red-500/30">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 fade-in-up">
      {/* Overview Header */}
      <div className="glass-card p-6 border-themed flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-violet-500/10 border border-violet-500/30">
          <BookOpen className="w-8 h-8 text-violet-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Skill Gap Advisor</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            We identified {data.missingSkills?.length || 0} key skills in the job description that are missing from your resume. Below are targeted resources to help you acquire them.
          </p>
        </div>
      </div>

      {/* Missing Skills Tags */}
      <div className="glass-card p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
          Missing Competencies
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.missingSkills?.length > 0 ? (
            data.missingSkills.map((skill, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {skill}
              </span>
            ))
          ) : (
            <div className="text-sm text-emerald-500 font-semibold bg-emerald-500/10 px-4 py-2 rounded-lg w-full">
              ✨ Great job! Your resume covers all major keywords in this JD.
            </div>
          )}
        </div>
      </div>

      {/* Recommended Courses List */}
      {data.recommendedCourses?.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--text-primary)' }}>
            Recommended Learning Paths
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendedCourses.map((course, idx) => (
              <div key={idx} className="glass-card p-5 border-l-4 border-violet-500 hover:-translate-y-1 transition-transform duration-200 cursor-default">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">
                    For: {course.skill}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-themed-secondary">
                    {getPlatformIcon(course.platform)}
                    {course.platform}
                  </div>
                </div>
                
                <h5 className="font-bold text-base mt-3" style={{ color: 'var(--text-primary)' }}>
                  {course.courseName}
                </h5>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {course.reason}
                </p>
                
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(course.courseName + ' ' + (course.platform || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                >
                  Search for this course <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapAdvisor;
