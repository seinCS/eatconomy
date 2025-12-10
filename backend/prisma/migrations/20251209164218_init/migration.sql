-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergies" TEXT[],
    "dislikedFoods" TEXT[],
    "spicinessLevel" INTEGER NOT NULL,
    "cookingSkill" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fridge_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fridge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "recipeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liked_recipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liked_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disliked_recipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disliked_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_finished" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_finished_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_provider_providerId_idx" ON "users"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "fridge_items_userId_idx" ON "fridge_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fridge_items_userId_name_key" ON "fridge_items"("userId", "name");

-- CreateIndex
CREATE INDEX "plans_userId_idx" ON "plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_userId_slotIndex_key" ON "plans"("userId", "slotIndex");

-- CreateIndex
CREATE INDEX "liked_recipes_userId_idx" ON "liked_recipes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "liked_recipes_userId_recipeId_key" ON "liked_recipes"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "disliked_recipes_userId_idx" ON "disliked_recipes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "disliked_recipes_userId_recipeId_key" ON "disliked_recipes"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "shopping_checks_userId_idx" ON "shopping_checks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_checks_userId_itemName_key" ON "shopping_checks"("userId", "itemName");

-- CreateIndex
CREATE INDEX "meal_finished_userId_idx" ON "meal_finished"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_finished_userId_dateKey_mealType_key" ON "meal_finished"("userId", "dateKey", "mealType");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_items" ADD CONSTRAINT "fridge_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_recipes" ADD CONSTRAINT "liked_recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disliked_recipes" ADD CONSTRAINT "disliked_recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_checks" ADD CONSTRAINT "shopping_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_finished" ADD CONSTRAINT "meal_finished_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
