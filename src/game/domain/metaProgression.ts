export interface MetaProgressionInput {
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestCorruptedLoop: number;
}

export interface ArchiveMilestoneSnapshot {
  readonly id: string;
  readonly name: string;
  readonly seal: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly percent: number;
  readonly requirementText: string;
}

export interface AchievementSnapshot {
  readonly id: string;
  readonly name: string;
  readonly badge: string;
  readonly description: string;
  readonly current: number;
  readonly target: number;
  readonly unlocked: boolean;
  readonly percent: number;
}

export interface MetaProgressionSnapshot {
  readonly milestones: readonly ArchiveMilestoneSnapshot[];
  readonly currentRank: ArchiveMilestoneSnapshot;
  readonly nextRank: ArchiveMilestoneSnapshot | null;
  readonly achievements: readonly AchievementSnapshot[];
  readonly unlockedAchievementCount: number;
  readonly totalAchievementCount: number;
  readonly discoveredSecondStageRecipes: number;
  readonly totalSecondStageRecipes: number;
}

interface MilestoneRequirement {
  readonly itemTarget: number;
  readonly recipeTarget: number;
  readonly secondStageTarget: number;
  readonly loopTarget: number;
}

export function createMetaProgressionSnapshot(
  allItemIds: readonly string[],
  allRecipeIds: readonly string[],
  secondStageRecipeIds: readonly string[],
  input: MetaProgressionInput,
): MetaProgressionSnapshot {
  const itemIds = uniqueKnownIds(allItemIds, input.discoveredItemIds);
  const recipeIds = uniqueKnownIds(allRecipeIds, input.discoveredRecipeIds);
  const secondStageSet = new Set(secondStageRecipeIds.filter((id) => allRecipeIds.includes(id)));
  const discoveredSecondStageRecipes = [...recipeIds].filter((id) => secondStageSet.has(id)).length;
  const totalSecondStageRecipes = secondStageSet.size;
  const bestLoop = Math.max(0, Math.floor(Number.isFinite(input.bestCorruptedLoop) ? input.bestCorruptedLoop : 0));

  const itemTotal = allItemIds.length;
  const recipeTotal = allRecipeIds.length;
  const itemCount = itemIds.size;
  const recipeCount = recipeIds.size;

  const requirements: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly seal: string;
    readonly description: string;
    readonly requirement: MilestoneRequirement;
  }> = [
    {
      id: 'dumpster-intern',
      name: 'Dumpster Intern',
      seal: 'PAPER CLIP SEAL',
      description: 'The archive reluctantly acknowledges your employment.',
      requirement: { itemTarget: 0, recipeTarget: 0, secondStageTarget: 0, loopTarget: 0 },
    },
    {
      id: 'scrap-scout',
      name: 'Scrap Scout',
      seal: 'LIME SCRAP SEAL',
      description: 'Enough junk catalogued to prove this was intentional.',
      requirement: { itemTarget: ratioTarget(itemTotal, 0.15), recipeTarget: 0, secondStageTarget: 0, loopTarget: 0 },
    },
    {
      id: 'junk-curator',
      name: 'Junk Curator',
      seal: 'BRASS CATALOG PLATE',
      description: 'Your filing system has become worryingly professional.',
      requirement: {
        itemTarget: ratioTarget(itemTotal, 0.4),
        recipeTarget: ratioTarget(recipeTotal, 0.15),
        secondStageTarget: 0,
        loopTarget: 0,
      },
    },
    {
      id: 'fusion-librarian',
      name: 'Fusion Librarian',
      seal: 'PINK FUSION STAMP',
      description: 'You have documented enough impossible objects to become a liability.',
      requirement: {
        itemTarget: ratioTarget(itemTotal, 0.7),
        recipeTarget: ratioTarget(recipeTotal, 0.5),
        secondStageTarget: Math.min(1, totalSecondStageRecipes),
        loopTarget: 0,
      },
    },
    {
      id: 'void-archivist',
      name: 'Void Archivist',
      seal: 'CORRUPTED CROWN SEAL',
      description: 'Complete the archive and survive a corrupted cycle. The filing cabinet now fears you.',
      requirement: {
        itemTarget: itemTotal,
        recipeTarget: recipeTotal,
        secondStageTarget: totalSecondStageRecipes,
        loopTarget: 2,
      },
    },
  ];

  const milestones = requirements.map((definition): ArchiveMilestoneSnapshot => {
    const progressValues = requirementProgressValues(
      definition.requirement,
      itemCount,
      recipeCount,
      discoveredSecondStageRecipes,
      bestLoop,
    );
    const unlocked = progressValues.every((value) => value >= 1);
    return {
      id: definition.id,
      name: definition.name,
      seal: definition.seal,
      description: definition.description,
      unlocked,
      percent: unlocked ? 100 : Math.round(Math.min(...progressValues) * 100),
      requirementText: requirementText(definition.requirement, itemTotal, recipeTotal, totalSecondStageRecipes),
    };
  });

  const currentRank = [...milestones].reverse().find((milestone) => milestone.unlocked) ?? milestones[0]!;
  const currentIndex = milestones.findIndex((milestone) => milestone.id === currentRank.id);
  const nextRank = milestones[currentIndex + 1] ?? null;

  const achievements = [
    achievement('first-find', 'First Find', '◆', 'Discover your first junk item.', itemCount, Math.min(1, itemTotal)),
    achievement('junk-drawer', 'Junk Drawer', '▦', 'Discover ten junk definitions.', itemCount, Math.min(10, itemTotal)),
    achievement('half-the-heap', 'Half the Heap', '◐', 'Discover half of the current Itemdex.', itemCount, ratioTarget(itemTotal, 0.5)),
    achievement('full-itemdex', 'Total Recall', '★', 'Discover every current item definition.', itemCount, itemTotal),
    achievement('first-fusion', 'Unsafe Chemistry', '+', 'Discover your first fusion recipe.', recipeCount, Math.min(1, recipeTotal)),
    achievement('lab-notes', 'Lab Notes', '≋', 'Discover six fusion recipes.', recipeCount, Math.min(6, recipeTotal)),
    achievement('forbidden-cookbook', 'Forbidden Cookbook', '▤', 'Discover half of the current Recipe Book.', recipeCount, ratioTarget(recipeTotal, 0.5)),
    achievement('full-recipe-book', 'Recipe Completionist', '✦', 'Discover every current fusion recipe.', recipeCount, recipeTotal),
    achievement('secret-spark', 'That Should Not Exist', '!', 'Discover one second-stage secret evolution.', discoveredSecondStageRecipes, Math.min(1, totalSecondStageRecipes)),
    achievement('secret-archive', 'Forbidden Shelf', '✧', 'Discover every current second-stage evolution.', discoveredSecondStageRecipes, totalSecondStageRecipes),
    achievement('corrupted-tourist', 'Corrupted Tourist', 'Ⅱ', 'Complete Corrupted Loop 2.', bestLoop, 2),
    achievement('corrupted-resident', 'Corrupted Resident', 'Ⅲ', 'Complete Corrupted Loop 3.', bestLoop, 3),
    achievement('void-clerk', 'Void Clerk', 'Ⅴ', 'Complete Corrupted Loop 5.', bestLoop, 5),
  ];

  return {
    milestones,
    currentRank,
    nextRank,
    achievements,
    unlockedAchievementCount: achievements.filter((entry) => entry.unlocked).length,
    totalAchievementCount: achievements.length,
    discoveredSecondStageRecipes,
    totalSecondStageRecipes,
  };
}

function uniqueKnownIds(allIds: readonly string[], discoveredIds: readonly string[]): Set<string> {
  const known = new Set(allIds);
  return new Set(discoveredIds.filter((id) => known.has(id)));
}

function ratioTarget(total: number, ratio: number): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.ceil(total * ratio));
}

function progressValue(current: number, target: number): number {
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, current / target));
}

function requirementProgressValues(
  requirement: MilestoneRequirement,
  itemCount: number,
  recipeCount: number,
  secondStageCount: number,
  bestLoop: number,
): readonly number[] {
  return [
    progressValue(itemCount, requirement.itemTarget),
    progressValue(recipeCount, requirement.recipeTarget),
    progressValue(secondStageCount, requirement.secondStageTarget),
    progressValue(bestLoop, requirement.loopTarget),
  ];
}

function requirementText(
  requirement: MilestoneRequirement,
  itemTotal: number,
  recipeTotal: number,
  secondStageTotal: number,
): string {
  const parts: string[] = [];
  if (requirement.itemTarget > 0) parts.push(`${requirement.itemTarget}/${itemTotal} items`);
  if (requirement.recipeTarget > 0) parts.push(`${requirement.recipeTarget}/${recipeTotal} recipes`);
  if (requirement.secondStageTarget > 0) parts.push(`${requirement.secondStageTarget}/${secondStageTotal} secret evolutions`);
  if (requirement.loopTarget > 0) parts.push(`complete Loop ${requirement.loopTarget}`);
  return parts.length > 0 ? parts.join(' • ') : 'Available immediately';
}

function achievement(
  id: string,
  name: string,
  badge: string,
  description: string,
  current: number,
  target: number,
): AchievementSnapshot {
  const safeTarget = Math.max(0, target);
  const safeCurrent = Math.max(0, Math.floor(current));
  const unlocked = safeTarget <= 0 || safeCurrent >= safeTarget;
  return {
    id,
    name,
    badge,
    description,
    current: safeCurrent,
    target: safeTarget,
    unlocked,
    percent: unlocked ? 100 : Math.round(progressValue(safeCurrent, safeTarget) * 100),
  };
}
