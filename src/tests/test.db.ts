import { UtmRepository } from "../repositories/utm.repository";
import { UtmService } from "../services/utm.service";
import { logger } from "../utils/logger";

const repo = new UtmRepository();
const service = new UtmService(repo);

async function dbTest() {
  logger.info("Тестирование БД и инициализация");
  console.time("Execution Time");

  try {
    logger.info("Попытка добавления нового UTM...");

    const addUtm = await service.addUtm({
      name: "RSA-56",
      ip: "localhost",
      port: 8080,
      location: "Хабаровск, Панфиловцев",
      environment: "arm",
    });

    logger.info({ utm: addUtm }, "Сервер успешно добавлен в БД");

    const allUtms = await service.getAllUtms();

    logger.info(`Всего UTM в БД: ${allUtms.length}`);

    console.table(
      allUtms.map((u) => ({
        name: u.name,
        ip: u.ip,
        port: u.port,
        env: u.environment,
        loc: u.location,
      }))
    );
  } catch (err) {
    logger.error(err, "Ошибка во время выполнения теста");
  } finally {
    console.timeEnd("Execution Time");
    logger.info("Тест завершен");
    process.exit();
  }
}

dbTest();
