import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Trophy, Sparkles } from 'lucide-react';
import './Countdown.css';

interface CountdownProps {
  targetDate: Date;
  title?: string;
  onComplete?: () => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown: React.FC<CountdownProps> = ({ 
  targetDate, 
  title = "Fin de la compétition",
  onComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const difference = targetDate.getTime() - Date.now();
      
      if (difference <= 0) {
        setIsComplete(true);
        if (onComplete) onComplete();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      // Less than 1 hour = urgent
      setIsUrgent(difference < 3600000);

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const padNumber = (num: number): string => String(num).padStart(2, '0');

  if (isComplete) {
    return (
      <motion.div 
        className="countdown countdown-complete"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="countdown-header">
          <Trophy className="countdown-icon trophy" size={24} />
          <span className="countdown-title">Compétition terminée!</span>
        </div>
        <div className="countdown-complete-message">
          <Sparkles size={20} />
          <span>Résultats disponibles</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`countdown ${isUrgent ? 'countdown-urgent' : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="countdown-header">
        {isUrgent ? (
          <AlertTriangle className="countdown-icon urgent" size={20} />
        ) : (
          <Clock className="countdown-icon" size={20} />
        )}
        <span className="countdown-title">{title}</span>
      </div>

      <div className="countdown-timer">
        <AnimatePresence mode="popLayout">
          <motion.div 
            className="time-unit"
            key={`h-${timeLeft.hours}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="time-value">{padNumber(timeLeft.hours)}</span>
            <span className="time-label">heures</span>
          </motion.div>
        </AnimatePresence>

        <span className="time-separator">:</span>

        <AnimatePresence mode="popLayout">
          <motion.div 
            className="time-unit"
            key={`m-${timeLeft.minutes}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="time-value">{padNumber(timeLeft.minutes)}</span>
            <span className="time-label">minutes</span>
          </motion.div>
        </AnimatePresence>

        <span className="time-separator">:</span>

        <AnimatePresence mode="popLayout">
          <motion.div 
            className="time-unit"
            key={`s-${timeLeft.seconds}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="time-value">{padNumber(timeLeft.seconds)}</span>
            <span className="time-label">secondes</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {isUrgent && (
        <motion.div 
          className="countdown-warning"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Moins d'une heure restante!
        </motion.div>
      )}
    </motion.div>
  );
};

export default Countdown;
