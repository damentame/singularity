import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah & Michael',
    location: 'Cape Town, South Africa',
    eventType: 'Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    rating: 5,
    text: 'The One made planning our dream wedding at Delaire Graff Estate absolutely seamless. We found the most incredible suppliers and our day was beyond perfect.',
  },
  {
    id: 2,
    name: 'Emma Thompson',
    location: 'London, UK',
    eventType: 'Corporate Gala',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    rating: 5,
    text: 'As an event coordinator, The One has transformed how I source suppliers for my clients. The quality is unmatched and the platform is incredibly intuitive.',
  },
  {
    id: 3,
    name: 'James & Olivia',
    location: 'Ravello, Italy',
    eventType: 'Destination Wedding',
    image: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400',
    rating: 5,
    text: 'Planning a destination wedding from abroad seemed daunting, but The One connected us with the most amazing local suppliers. Villa Cimbrone was magical.',
  },
  {
    id: 4,
    name: 'David Chen',
    location: 'Dubai, UAE',
    eventType: 'Birthday Celebration',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    rating: 5,
    text: 'Organized my wife\'s 40th at the Burj Al Arab through The One. Every supplier was exceptional. The attention to detail was remarkable.',
  },
];

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-28 relative" style={{ backgroundColor: '#0B1426' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <span 
            className="text-xs uppercase tracking-[0.2em] text-gold"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Client Stories
          </span>
          <h2 
            className="text-4xl md:text-5xl font-light mt-5 mb-5 tracking-[0.06em]"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            What Our Clients Say
          </h2>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl shadow-2xl p-12 md:p-16 border border-gold/[0.15]" style={{ backgroundColor: '#152238' }}>
            {/* Quote Icon */}
            <div className="absolute -top-7 left-12">
              <div className="w-14 h-14 bg-gradient-to-br from-gold-light to-gold rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-7 h-7" style={{ color: '#0B1426' }} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-center">
              {/* Image */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={current.image}
                    alt={current.name}
                    className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-gold/25" />
                  <div className="absolute -inset-2 rounded-full border border-gold/15" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                {/* Rating */}
                <div className="flex justify-center md:justify-start gap-1.5 mb-8">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                  ))}
                </div>

                {/* Text */}
                <p 
                  className="text-xl md:text-2xl leading-relaxed mb-10 italic font-light"
                  style={{ 
                    color: '#FFFFFF',
                    fontFamily: '"Playfair Display", Georgia, serif',
                    opacity: 0.9,
                  }}
                >
                  "{current.text}"
                </p>

                {/* Author */}
                <div>
                  <h4 
                    className="text-2xl font-light tracking-[0.05em]"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: '"Playfair Display", Georgia, serif',
                    }}
                  >
                    {current.name}
                  </h4>
                  <p 
                    className="text-gold text-sm mt-2"
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  >
                    {current.eventType} • {current.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={prevTestimonial}
                className="w-14 h-14 rounded-full border border-white/[0.15] flex items-center justify-center hover:border-gold hover:bg-gold/[0.08] transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-14 h-14 rounded-full border border-white/[0.15] flex items-center justify-center hover:border-gold hover:bg-gold/[0.08] transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-gradient-to-r from-gold-light to-gold w-8' 
                      : 'bg-white/20 hover:bg-gold/50 w-2.5'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
