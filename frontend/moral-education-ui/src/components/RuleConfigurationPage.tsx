import React, { useState } from 'react';
import RuleChapterManagementPage from './RuleChapterManagementPage';
import RuleDimensionManagementPage from './RuleDimensionManagementPage';
import RuleSubItemManagementPage from './RuleSubItemManagementPage';
import { RuleChapter, RuleDimension } from '../services/apiService';

// Navigation levels
enum RuleLevel {
  CHAPTER = 'chapter',
  DIMENSION = 'dimension',
  SUBITEM = 'subitem'
}

const RuleConfigurationPage: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<RuleLevel>(RuleLevel.CHAPTER);
  const [selectedChapter, setSelectedChapter] = useState<RuleChapter | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<RuleDimension | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{label: string, level: RuleLevel, onClick: () => void}[]>([
    { label: 'Chapters', level: RuleLevel.CHAPTER, onClick: () => navigateToLevel(RuleLevel.CHAPTER) }
  ]);

  const navigateToLevel = (level: RuleLevel, chapter?: RuleChapter, dimension?: RuleDimension) => {
    setCurrentLevel(level);
    
    // Update breadcrumbs based on navigation level
    if (level === RuleLevel.CHAPTER) {
      setBreadcrumbs([{ label: 'Chapters', level: RuleLevel.CHAPTER, onClick: () => navigateToLevel(RuleLevel.CHAPTER) }]);
      setSelectedChapter(null);
      setSelectedDimension(null);
    } else if (level === RuleLevel.DIMENSION && chapter) {
      setSelectedChapter(chapter);
      setSelectedDimension(null);
      setBreadcrumbs([
        { label: 'Chapters', level: RuleLevel.CHAPTER, onClick: () => navigateToLevel(RuleLevel.CHAPTER) },
        { label: `Chapter: ${chapter.name}`, level: RuleLevel.DIMENSION, onClick: () => navigateToLevel(RuleLevel.DIMENSION, chapter) }
      ]);
    } else if (level === RuleLevel.SUBITEM && dimension && chapter) {
      setSelectedChapter(chapter);
      setSelectedDimension(dimension);
      setBreadcrumbs([
        { label: 'Chapters', level: RuleLevel.CHAPTER, onClick: () => navigateToLevel(RuleLevel.CHAPTER) },
        { label: `Chapter: ${chapter.name}`, level: RuleLevel.DIMENSION, onClick: () => navigateToLevel(RuleLevel.DIMENSION, chapter) },
        { label: `Dimension: ${dimension.name}`, level: RuleLevel.SUBITEM, onClick: () => navigateToLevel(RuleLevel.SUBITEM, chapter, dimension) }
      ]);
    }
  };

  const handleViewDimensions = (chapter: RuleChapter) => {
    navigateToLevel(RuleLevel.DIMENSION, chapter);
  };

  const handleViewSubItems = (dimension: RuleDimension) => {
    navigateToLevel(RuleLevel.SUBITEM, selectedChapter, dimension);
  };

  const handleBackToChapters = () => {
    navigateToLevel(RuleLevel.CHAPTER);
  };

  const handleBackToDimensions = () => {
    if (selectedChapter) {
      navigateToLevel(RuleLevel.DIMENSION, selectedChapter);
    } else {
      navigateToLevel(RuleLevel.CHAPTER);
    }
  };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center space-x-2 mb-4 bg-gray-100 p-2 rounded">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-500">/</span>}
            <button 
              onClick={crumb.onClick}
              className={`text-sm ${currentLevel === crumb.level ? 'font-bold text-blue-600' : 'text-blue-500 hover:text-blue-700'}`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Moral Education Rule Configuration</h1>
      
      {renderBreadcrumbs()}
      
      {currentLevel === RuleLevel.CHAPTER && (
        <RuleChapterManagementPage onViewDimensions={handleViewDimensions} />
      )}
      
      {currentLevel === RuleLevel.DIMENSION && selectedChapter && (
        <RuleDimensionManagementPage 
          chapterId={selectedChapter.id} 
          onBack={handleBackToChapters}
          onViewSubItems={handleViewSubItems}
        />
      )}
      
      {currentLevel === RuleLevel.SUBITEM && selectedDimension && (
        <RuleSubItemManagementPage 
          dimensionId={selectedDimension.id} 
          onBack={handleBackToDimensions}
        />
      )}
    </div>
  );
};

export default RuleConfigurationPage;
