
import React from 'react';

interface Club {
  name?: string;
  // Add other properties as needed
}

interface ClubFullInfoProps {
  club: Club;
  country: string;
  isCompact: boolean;
}

const ClubFullInfo: React.FC<ClubFullInfoProps> = ({ club, country, isCompact }) => {
  return (
    <div className={`club_header ${isCompact ? 'compact' : ''}`}>
      <div className="club_header-main">
        <h3>{club.name || 'Club Name'}</h3>
        <p>{country}</p>
      </div>
    </div>
  );
};

export default ClubFullInfo;
