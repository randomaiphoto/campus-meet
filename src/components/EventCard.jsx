import { Link } from "react-router-dom";

export default function EventCard({ event, featured = false }) {
  const formatDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link 
      to={`/events/${event.id}`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group flex flex-col h-full"
    >
      {/* Event image */}
      <div className="h-40 bg-indigo-100 relative">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-400">
            <span className="text-white text-4xl">{event.title?.charAt(0) || '📅'}</span>
          </div>
        )}
        {featured && (
          <div className="absolute top-0 left-0 m-3">
            <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">
              Featured
            </span>
          </div>
        )}
        <div className="absolute top-0 right-0 m-3">
          <button 
            onClick={(e) => {
              e.preventDefault();
              alert("Event saved!");
            }}
            className="p-1.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full text-gray-600 hover:text-indigo-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Event details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-indigo-600 font-medium mb-1">
          {formatDate(event.date)}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
          {event.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
          <span className="text-sm bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
            {event.attendeeCount || 0} attendees
          </span>
        </div>
      </div>
    </Link>
  );
}
