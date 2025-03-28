import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Token } from '../entities/token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  /**
   * Her gün gece yarısı çalışarak süresi dolmuş tokenları temizler
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    this.logger.log('Süresi dolmuş token temizleme görevi başlatıldı');

    try {
      const now = new Date();

      const result = await this.tokenRepository.delete({
        expires: LessThan(now),
      });

      this.logger.log(`${result.affected} adet süresi dolmuş token temizlendi`);
    } catch (error) {
      this.logger.error('Token temizleme sırasında hata oluştu:', error.stack);
    }
  }

  /**
   * İsteğe bağlı olarak çağrılabilecek, belirli bir süreden eski olan kullanılmamış tokenları temizleyen metot
   * @param days Gün sayısı
   */
  async cleanupOldTokens(days: number = 90) {
    this.logger.log(`${days} günden eski kullanılmamış tokenlar temizleniyor`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.tokenRepository.delete({
        createdAt: LessThan(cutoffDate),
        isRevoked: false,
      });

      this.logger.log(`${result.affected} adet eski token temizlendi`);
    } catch (error) {
      this.logger.error(
        'Eski token temizleme sırasında hata oluştu:',
        error.stack,
      );
    }
  }
}
