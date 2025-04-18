
import React from 'react';
import styled from 'styled-components';
import theme from 'styled-theming'; // Ensure this import is correct
import { useWindowSize } from 'react-use';

// Using relative paths instead of the alias to ensure proper module resolution
import ClubFullInfo from './ClubFullInfo';
import Spring from './Spring';

// Define more specific types for club and country
interface Club {
  // Add specific properties of the club object based on your application's data model
  name?: string;
  // Add other relevant properties
}

interface ClubCardProps {
  country: string;
  club: Club;
  index: number;
}

const Container = styled.div`
  background: ${theme('theme', {
    light: 'var(--widget)',
    dark: 'var(--border)'
  })};
  position: relative;
  height: 220px;
  padding: var(--card-padding);
  box-shadow: var(--widget-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  .club_header {
    flex-direction: column;
    align-items: flex-start;
    
    &-main {
      gap: 4px;
    }
  }
  
  .num {
    position: absolute;
    font-size: 227px;
    font-family: var(--heading-font);
    font-weight: 900;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    ${theme('theme', {
        light: `
            color: #282828;
            opacity: 0.03;
        `,
        dark: `
            color: #111312;
            opacity: 0.12;
        `
    })};
  }
`;

const ClubCard: React.FC<ClubCardProps> = ({ country, club, index }) => {
  const width = useWindowSize().width;

  return (
    <Spring type="slideUp" index={index}>
      <Container>
        <ClubFullInfo 
          club={club} 
          country={country} 
          isCompact={width < 1024 || (width >= 1500 && width < 2000)}
        />
        <span className="num">{index + 1}</span>
      </Container>
    </Spring>
  );
};

export default ClubCard;
